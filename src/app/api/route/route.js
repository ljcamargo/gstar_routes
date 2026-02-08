import { findRouteWithGemini } from '@/lib/gemini';
import { findLeastCost } from '@/lib/dijkstra';
import { getStations, getEdges } from '@/lib/data';

export async function POST(request) {
    try {
        const { originId, destinationId, useLLM = true, selectedSystems = [], userPrompt = "" } = await request.json();

        if (!originId || !destinationId) {
            return Response.json({ error: "Origin and destination are required" }, { status: 400 });
        }

        const stations = getStations();
        const nodeIds = stations.map(s => s.id);

        // Filter edges based on selected systems
        let edges = getEdges();
        if (selectedSystems.length > 0) {
            edges = edges.filter(edge => {
                const s1 = stations.find(s => s.id === edge.node1);
                const s2 = stations.find(s => s.id === edge.node2);
                if (!s1 || !s2) return false;
                return selectedSystems.includes(s1.system_id) && selectedSystems.includes(s2.system_id);
            });
        }

        let result;
        if (useLLM) {
            // For Gemini, we still need a subset
            const llmEdges = edges.slice(0, 700);
            const geminiResult = await findRouteWithGemini(originId, destinationId, llmEdges, userPrompt);

            result = {
                foreword: geminiResult.foreword,
                options: geminiResult.options.map(option => ({
                    ...option,
                    path: option.path.map(id => stations.find(s => s.id === id) || { id, name: id })
                }))
            };
        } else {
            // Classical implementation
            const path = findLeastCost(nodeIds, edges, originId, destinationId, 'time');
            result = {
                foreword: "Aquí tienes la ruta más rápida calculada mediante el algoritmo clásico.",
                options: [{
                    name: "Ruta Directa",
                    cost: path.cost,
                    path: path.path.map(id => stations.find(s => s.id === id) || { id, name: id })
                }]
            };
        }

        return Response.json({ result });
    } catch (error) {
        console.error("Route finding error:", error);
        return Response.json({ error: error.message }, { status: 500 });
    }
}
