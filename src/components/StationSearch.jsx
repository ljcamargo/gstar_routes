"use client";

import { useState, useEffect, useCallback } from 'react';

export default function StationSearch({ label, onSelect, placeholder }) {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (query.length < 2) {
            setResults([]);
            return;
        }

        const timer = setTimeout(async () => {
            setLoading(true);
            try {
                const response = await fetch(`/api/stations?q=${encodeURIComponent(query)}`);
                const data = await response.json();
                setResults(data.slice(0, 8)); // Limit to 8 results for UI
            } catch (e) {
                console.error("Search error", e);
            } finally {
                setLoading(false);
            }
        }, 300);

        return () => clearTimeout(timer);
    }, [query]);

    const handleSelect = (station) => {
        setQuery(station.name);
        setIsOpen(false);
        onSelect(station);
    };

    return (
        <div className="relative w-full">
            <label className="block text-sm font-medium text-slate-400 mb-1 ml-1">{label}</label>
            <input
                type="text"
                value={query}
                onChange={(e) => {
                    setQuery(e.target.value);
                    setIsOpen(true);
                }}
                onFocus={() => setIsOpen(true)}
                placeholder={placeholder}
                className="w-full bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-3 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500/50 focus:border-sky-500 smooth-transition"
            />

            {isOpen && (query.length >= 2 || loading) && (
                <div className="absolute z-10 w-full mt-2 glass rounded-xl overflow-hidden shadow-2xl animate-in fade-in slide-in-from-top-2 duration-200">
                    {loading ? (
                        <div className="p-4 text-center text-slate-400">Searching...</div>
                    ) : results.length > 0 ? (
                        results.map((station) => (
                            <button
                                key={station.id}
                                onClick={() => handleSelect(station)}
                                className="w-full px-4 py-3 text-left hover:bg-sky-500/10 hover:text-sky-400 border-b border-slate-700/50 last:border-0 smooth-transition flex items-center justify-between"
                            >
                                <div>
                                    <div className="font-medium">{station.name}</div>
                                    <div className="text-xs text-slate-500">{station.system_id.toUpperCase()} • Line {station.line_id.split('_').pop()}</div>
                                </div>
                                <div className="w-2 h-2 rounded-full bg-slate-600"></div>
                            </button>
                        ))
                    ) : (
                        <div className="p-4 text-center text-slate-400">No stations found</div>
                    )}
                </div>
            )}
        </div>
    );
}
