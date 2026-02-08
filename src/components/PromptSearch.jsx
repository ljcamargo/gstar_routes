"use client";

import { useState } from 'react';

export default function PromptSearch({ onIntentDiscovered }) {
    const [prompt, setPrompt] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!prompt.trim() || loading) return;

        setLoading(true);
        try {
            const response = await fetch('/api/interpret', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt })
            });
            const data = await response.json();

            if (data.intent) {
                onIntentDiscovered(data.intent, prompt);
            } else if (data.error) {
                console.error("Interpretation error", data.error);
            }
        } catch (e) {
            console.error("Prompt submit error", e);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="w-full glass rounded-2xl p-4 mb-6 relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-sky-500 to-purple-600 opacity-50 group-hover:opacity-100 smooth-transition"></div>

            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3 ml-1 flex items-center">
                <span className="mr-2">✨</span> Gemini Dynamic Search
            </h3>

            <form onSubmit={handleSubmit} className="relative">
                <input
                    type="text"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="e.g. Fastest way from Metro Buenavista to Pantitlán..."
                    className="w-full bg-slate-800/50 border border-slate-700/50 rounded-xl px-4 py-3 pr-12 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500/50 smooth-transition text-sm"
                    disabled={loading}
                />
                <button
                    type="submit"
                    disabled={loading || !prompt.trim()}
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg flex items-center justify-center bg-sky-500 text-slate-900 hover:bg-sky-400 disabled:opacity-30 smooth-transition shadow-lg shadow-sky-500/20"
                >
                    {loading ? (
                        <div className="w-4 h-4 border-2 border-slate-900 border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                        '→'
                    )}
                </button>
            </form>

            <p className="text-[10px] text-slate-500 mt-2 ml-1 italic">
                Ask in naturally, Gemini will configure the search for you.
            </p>
        </div>
    );
}
