"use client";

import { getSystems } from '@/lib/data';

export default function SystemFilter({ selectedSystems, onChange }) {
    const systems = getSystems();

    const toggleSystem = (id) => {
        if (selectedSystems.includes(id)) {
            onChange(selectedSystems.filter(sysId => sysId !== id));
        } else {
            onChange([...selectedSystems, id]);
        }
    };

    return (
        <div className="w-full glass rounded-2xl p-4 mb-6">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3 ml-1">Include Systems</h3>
            <div className="flex flex-wrap gap-2">
                {systems.map(system => {
                    const isSelected = selectedSystems.includes(system.id);
                    return (
                        <button
                            key={system.id}
                            onClick={() => toggleSystem(system.id)}
                            className={`px-3 py-1.5 rounded-full text-[10px] font-bold tracking-wider uppercase smooth-transition border ${isSelected
                                ? 'bg-sky-500/20 text-sky-400 border-sky-500/50 shadow-[0_0_10px_rgba(14,165,233,0.2)]'
                                : 'bg-slate-800/50 text-slate-500 border-slate-700 hover:border-slate-600'
                                }`}
                        >
                            {system.short}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
