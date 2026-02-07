import { findRouteWithGemini } from '@/lib/gemini';
import { findLeastCost } from '@/lib/dijkstra';
import { getStations, getEdges } from '@/lib/data';

export async function POST(request) {
    try {
        const { originId, destinationId, useLLM = true } = await request.json();

        if (!originId || !destinationId) {
            return Response.json({ error: "Origin and destination are required" }, { status: 400 });
        }

        const stations = getStations();
        const edges = getEdges();
        const nodeIds = stations.map(s => s.id);

        let result;
        if (useLLM) {
            // LLM implementation
            // We filter edges to not overwhelm the prompt
            // For MVP we might just take a subset or rely on Gemini's capacity
            const filteredEdges = edges.slice(0, 500); // placeholder for filtering logic
            result = await findRouteWithGemini(originId, destinationId, filteredEdges);
        } else {
            // Classical implementation
            result = [findLeastCost(nodeIds, edges, originId, destinationId, 'time')];
        }

        return Response.json({ result });
    } catch (error) {
        console.error("Route finding error:", error);
        return Response.json({ error: error.message }, { status: 500 });
    }
}
