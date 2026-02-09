"use client";

import { useState, useEffect } from 'react';
import Image from 'next/image';
import StationSearch from '@/components/StationSearch';
import RouteDisplay from '@/components/RouteDisplay';
import SystemFilter from '@/components/SystemFilter';
import PromptSearch from '@/components/PromptSearch';

export default function Home() {
  const [origin, setOrigin] = useState(null);
  const [destination, setDestination] = useState(null);
  const [route, setRoute] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedSystems, setSelectedSystems] = useState(['stcmetro', 'metrobus', 'cablebus', 'trolebus', 'trenligero', 'insur']);
  const [userLocation, setUserLocation] = useState(null);
  const [dynamicPrompt, setDynamicPrompt] = useState("");
  const [apiKey, setApiKey] = useState("");

  useEffect(() => {
    // Attempt to get user location on mount for sorting search results
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          });
        },
        (error) => console.log("Initial geolocation suppressed or failed", error)
      );
    }
  }, []);

  const performSearch = async (o = origin, d = destination, systems = selectedSystems, prompt = dynamicPrompt) => {
    if (!o || !d) return;

    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/route', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          originId: o.id,
          destinationId: d.id,
          useLLM: true,
          selectedSystems: systems,
          userPrompt: prompt,
          apiKey: apiKey
        })
      });

      const data = await response.json();
      if (data.error) throw new Error(data.error);

      setRoute(data.result);
    } catch (e) {
      setError(e.message);
      console.error("Route error", e);
    } finally {
      setLoading(false);
    }
  };

  const handleIntentDiscovered = async (intent, originalPrompt) => {
    setLoading(true);
    setError(null);
    setDynamicPrompt(originalPrompt);

    try {
      // Resolve intent using AI interpretation if an explicit prompt exists
      if (originalPrompt) {
        const interpretationRes = await fetch('/api/interpret', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt: originalPrompt, apiKey: apiKey })
        });
        const interpretationData = await interpretationRes.json();
        if (interpretationData.error) throw new Error(interpretationData.error);
      }

      // Resolve origin
      const originRes = await fetch(`/api/stations?q=${encodeURIComponent(intent.origin_query)}&systems=${intent.selected_systems?.join(',') || ''}`);
      const originData = await originRes.json();
      const resolvedOrigin = originData[0];

      // Resolve destination
      const destRes = await fetch(`/api/stations?q=${encodeURIComponent(intent.destination_query)}&systems=${intent.selected_systems?.join(',') || ''}`);
      const destData = await destRes.json();
      const resolvedDestination = destData[0];

      if (resolvedOrigin) setOrigin(resolvedOrigin);
      if (resolvedDestination) setDestination(resolvedDestination);

      const ALL_SYSTEMS = ['stcmetro', 'metrobus', 'cablebus', 'trolebus', 'trenligero', 'insur'];
      let finalSystems = ALL_SYSTEMS;

      if (intent.selected_systems && intent.selected_systems.length > 0) {
        setSelectedSystems(intent.selected_systems);
        finalSystems = intent.selected_systems;
      } else {
        setSelectedSystems(ALL_SYSTEMS);
      }

      if (resolvedOrigin && resolvedDestination) {
        await performSearch(resolvedOrigin, resolvedDestination, finalSystems, originalPrompt);
      } else {
        if (!resolvedOrigin) setError(`Could not find station: ${intent.origin_query}`);
        else if (!resolvedDestination) setError(`Could not find station: ${intent.destination_query}`);
      }
    } catch (e) {
      console.error("Intent resolution error", e);
      setError("Failed to resolve transport intent. Please try manual selection.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen p-4 md:p-8 flex flex-col items-center bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black">
      {/* Background decoration */}
      <div className="fixed top-0 left-0 w-full h-full pointer-events-none overflow-hidden -z-10">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-sky-500/10 blur-[120px] rounded-full"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-500/10 blur-[120px] rounded-full"></div>
      </div>

      <header className="w-full max-w-5xl flex flex-col md:flex-row items-center justify-between mb-12 gap-6">
        <div className="flex items-center space-x-4">
          <div className="relative w-16 h-16 rounded-2xl overflow-hidden shadow-2xl shadow-sky-500/20">
            <div className="absolute inset-0 bg-gradient-to-br from-sky-400 to-purple-600 flex items-center justify-center text-white font-black text-2xl">G*</div>
          </div>
          <div>
            <h1 className="text-3xl font-black bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400 tracking-tighter">
              G*ROUTES CDMX
            </h1>
            <p className="text-slate-500 font-medium text-sm tracking-widest">GEMINI POWERED PUBLIC TRANSPORT</p>
          </div>
        </div>

        <div className="flex items-center space-x-3 glass p-2 rounded-2xl border border-white/5 w-full md:w-auto">
          <div className="w-10 h-10 rounded-xl bg-sky-500/10 flex items-center justify-center text-sky-400">
            <span className="text-sm font-bold">KEY</span>
          </div>
          <input
            type="password"
            placeholder="PASTE GEMINI API KEY..."
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            className="bg-transparent border-none outline-none text-sky-100 text-xs font-bold tracking-widest placeholder:text-slate-600 w-full md:w-64"
          />
        </div>
      </header>

      <section className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-5 space-y-6">
          <PromptSearch onIntentDiscovered={handleIntentDiscovered} onError={setError} />

          <div className="glass rounded-3xl p-6 md:p-8 space-y-8">

            <div className="space-y-6">
              <StationSearch
                label="ORIGIN"
                placeholder="Where are you starting?"
                station={origin}
                onSelect={setOrigin}
                allowGeo={true}
                selectedSystems={selectedSystems}
                userLocation={userLocation}
              />

              <div className="flex justify-center -my-4 relative z-10">
                <button
                  onClick={() => {
                    const tmp = origin;
                    setOrigin(destination);
                    setDestination(tmp);
                  }}
                  disabled={!origin && !destination}
                  title="Swap Origin and Destination"
                  className="w-10 h-10 bg-slate-800 border border-slate-700 rounded-full flex items-center justify-center text-slate-400 hover:text-sky-400 hover:border-sky-500/50 smooth-transition shadow-xl active:rotate-180 disabled:opacity-30 disabled:cursor-not-allowed group"
                >
                  <span className="group-hover:scale-110 smooth-transition">⇅</span>
                </button>
              </div>

              <StationSearch
                label="DESTINATION"
                placeholder="Where are you going?"
                station={destination}
                onSelect={setDestination}
                allowGeo={true}
                selectedSystems={selectedSystems}
                userLocation={userLocation}
              />

              <SystemFilter
                selectedSystems={selectedSystems}
                onChange={setSelectedSystems}
              />

              <div className="pt-4">
                <button
                  disabled={!origin || !destination || loading}
                  onClick={() => performSearch()}
                  className="w-full bg-gradient-to-r from-sky-500 to-sky-600 text-slate-950 font-bold py-4 px-2 rounded-xl shadow-lg shadow-sky-500/10 hover:shadow-sky-500/20 smooth-transition active:scale-95 disabled:opacity-50 disabled:scale-100 disabled:shadow-none tracking-widest text-xs whitespace-nowrap overflow-hidden text-ellipsis uppercase"
                >
                  {loading ? 'Thinking...' : 'Find*Routes'}
                </button>
              </div>
            </div>
          </div>

          <div className="glass rounded-3xl p-6 border-l-4 border-amber-500/50">
            <p className="text-sm text-slate-400 leading-relaxed font-medium">
              <span className="text-amber-400 font-bold mr-2">PRO TIP:</span>
              G*Star uses Gemini's advanced reasoning to find routes that consider more than just distance, like transfer complexity.
            </p>
          </div>
        </div>

        <div className="lg:col-span-7">
          {error && (
            <div className="glass border-red-500/50 rounded-3xl p-6 text-red-400 font-medium mb-8 animate-in fade-in slide-in-from-bottom-4">
              Error finding route: {error}
            </div>
          )}

          <RouteDisplay route={route} loading={loading} />

          {!route && !loading && (
            <div className="w-full aspect-[4/3] glass rounded-3xl flex flex-col items-center justify-center p-12 text-center group border-dashed border-2 border-slate-800">
              <div className="w-24 h-24 rounded-full bg-slate-800/50 flex items-center justify-center mb-8 group-hover:bg-sky-500/10 smooth-transition">
                <span className="text-4xl">📍</span>
              </div>
              <h4 className="text-xl font-bold text-slate-300 mb-2">Ready to plan your trip?</h4>
              <p className="text-slate-500 max-w-sm">Select your origin and destination stations to calculate the most efficient route across CDMX.</p>
            </div>
          )}
        </div>
      </section>

      <footer className="mt-20 py-8 text-slate-600 text-xs font-bold tracking-[0.2em] w-full max-w-5xl flex justify-between border-t border-slate-900">
        <div>Ɔ 2026 G*Routes by Luis J Camargo</div>
        <div className="flex space-x-6">
          <a href="#" className="hover:text-slate-400 smooth-transition">DOCUMENTATION</a>
          <a href="#" className="hover:text-slate-400 smooth-transition">API</a>
          <a href="#" className="hover:text-slate-400 smooth-transition">GITHUB</a>
        </div>
      </footer>
    </main>
  );
}
