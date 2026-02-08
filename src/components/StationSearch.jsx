"use client";

import { useState, useEffect } from 'react';

export default function StationSearch({ label, onSelect, placeholder, station, allowGeo }) {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [locating, setLocating] = useState(false);

    useEffect(() => {
        if (station) {
            setQuery(station.name || '');
        } else {
            setQuery('');
        }
    }, [station]);

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
                setResults(data.slice(0, 8));
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

    const handleLocate = () => {
        if (navigator.geolocation) {
            setLocating(true);
            navigator.geolocation.getCurrentPosition(
                async (position) => {
                    try {
                        const { latitude, longitude } = position.coords;
                        const response = await fetch(`/api/stations/nearest?lat=${latitude}&lon=${longitude}`);
                        const nearestStation = await response.json();
                        if (nearestStation && !nearestStation.error) {
                            handleSelect(nearestStation);
                        }
                    } catch (e) {
                        console.error("Locate error", e);
                    } finally {
                        setLocating(false);
                    }
                },
                (error) => {
                    console.error("Geolocation error", error);
                    setLocating(false);
                }
            );
        }
    };

    return (
        <div className="relative w-full">
            <label className="block text-sm font-medium text-slate-400 mb-1 ml-1">{label}</label>
            <div className="relative">
                <input
                    type="text"
                    value={query}
                    onChange={(e) => {
                        setQuery(e.target.value);
                        setIsOpen(true);
                    }}
                    onFocus={() => setIsOpen(true)}
                    // Timeout to allow the click event on results to fire before closing
                    onBlur={() => setTimeout(() => setIsOpen(false), 200)}
                    placeholder={placeholder}
                    className="w-full bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-3 pr-12 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500/50 focus:border-sky-500 smooth-transition"
                />
                {allowGeo && (
                    <button
                        type="button"
                        onClick={handleLocate}
                        className={`absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:text-sky-400 hover:bg-sky-400/10 smooth-transition ${locating ? 'animate-pulse text-sky-400' : ''}`}
                        title="Detect nearest station"
                    >
                        {locating ? '⌛' : '📍'}
                    </button>
                )}
            </div>

            {isOpen && (query.length >= 2 || loading) && (
                <div className="absolute z-10 w-full mt-2 glass rounded-xl overflow-hidden shadow-2xl animate-in fade-in slide-in-from-top-2 duration-200">
                    {loading ? (
                        <div className="p-4 text-center text-slate-400">Searching...</div>
                    ) : results.length > 0 ? (
                        results.map((station) => (
                            <button
                                key={station.id}
                                type="button"
                                onClick={() => handleSelect(station)}
                                className="w-full px-4 py-3 text-left hover:bg-sky-500/10 hover:text-sky-400 border-b border-slate-700/50 last:border-0 smooth-transition flex items-center justify-between"
                            >
                                <div>
                                    <div className="font-medium">{station.name}</div>
                                    <div className="text-xs text-slate-500 uppercase tracking-widest">
                                        {station.system_id} • LINE {station.line_id.split('_').pop()}
                                    </div>
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
