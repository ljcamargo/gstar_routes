"use client";

import { findStationById } from '@/lib/data';

export default function RouteDisplay({ route, loading }) {
    if (loading) {
        return (
            <div className="w-full glass rounded-2xl p-8 animate-pulse">
                <div className="h-6 bg-slate-700 rounded w-1/3 mb-6"></div>
                <div className="space-y-4">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="flex items-center space-x-4">
                            <div className="w-4 h-4 rounded-full bg-slate-700"></div>
                            <div className="h-4 bg-slate-700 rounded w-full"></div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    if (!route) return null;

    const { foreword, options } = route;
    const hasOptions = options && options.length > 0;

    // If we have neither options nor a foreword, then we have nothing to show
    if (!hasOptions && !foreword) return null;

    const selectedOption = hasOptions ? options[0] : null;
    const { path, cost, name } = selectedOption || {};

    let displayTitle = name || "Shortest Route";
    if (path && path.length >= 2) {
        const fromStation = path[0];
        const toStation = path[path.length - 1];
        if (fromStation?.name && toStation?.name) {
            displayTitle = `${fromStation.name} to ${toStation.name}`;
        }
    }

    return (
        <div className="w-full glass rounded-3xl p-6 md:p-8 animate-in fade-in zoom-in duration-500 overflow-hidden relative">
            {foreword && (
                <div className="mb-8 p-4 rounded-2xl bg-sky-500/10 border border-sky-500/20 text-sky-200 text-sm leading-relaxed italic">
                    <span className="text-sky-400 font-bold not-italic mr-2">AI:</span>
                    {foreword}
                </div>
            )}

            {hasOptions ? (
                <>
                    <div className="flex justify-between items-end mb-8">
                        <div>
                            <h2 className="text-2xl font-bold text-sky-400">{displayTitle}</h2>
                            <p className="text-slate-400">Estimated Travel Time</p>
                        </div>
                        <div className="text-right">
                            <span className="text-4xl font-black text-white">{Math.ceil(cost / 60)}</span>
                            <span className="ml-1 text-slate-400 font-medium">min</span>
                        </div>
                    </div>

                    <div className="relative">
                        <div className="absolute left-[11px] top-2 bottom-2 w-0.5 bg-gradient-to-b from-sky-500 via-purple-500 to-pink-500 rounded-full opacity-50"></div>

                        <div className="space-y-6">
                            {path.map((station, index) => {
                                const isFirst = index === 0;
                                const isLast = index === path.length - 1;
                                const displayName = station?.name || "Unknown Station";
                                const stationId = station?.id || index;

                                return (
                                    <div key={`${stationId}-${index}`} className="flex items-start space-x-6 group">
                                        <div className={`relative z-10 w-6 h-6 rounded-full border-4 border-slate-900 flex-shrink-0 mt-1 smooth-transition ${isFirst || isLast ? 'bg-sky-400 scale-110 shadow-[0_0_15px_rgba(56,189,248,0.5)]' : 'bg-slate-700'}`}>
                                        </div>

                                        <div className="flex-grow pb-2">
                                            <div className={`font-semibold smooth-transition ${isFirst || isLast ? 'text-white text-lg' : 'text-slate-300'}`}>
                                                {displayName}
                                            </div>
                                            {station?.system_id && (
                                                <div className="text-xs text-slate-500 font-medium tracking-wider">
                                                    {station.system_id.toUpperCase()} • LINE {station.line_id?.split('_').pop()}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </>
            ) : (
                <div className="text-center py-12 border-2 border-dashed border-slate-800 rounded-3xl">
                    <p className="text-slate-500">No se pudo generar un trazado detallado para esta consulta.</p>
                </div>
            )}

            <div className="mt-8 pt-6 border-t border-slate-700/50 flex items-center justify-between text-sm">
                <div className="flex items-center space-x-4">
                    <div className="text-slate-400 italic">Route generated by Gemini AI</div>
                </div>
            </div>
        </div>
    );
}
