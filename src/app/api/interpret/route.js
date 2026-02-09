import { promptToIntent } from '@/lib/aidijkstra';

export async function POST(request) {
    try {
        const { prompt } = await request.json();

        if (!prompt) {
            return Response.json({ error: "Prompt is required" }, { status: 400 });
        }

        const intent = await promptToIntent(prompt);

        if (!intent) {
            return Response.json({ error: "Could not interpret prompt" }, { status: 422 });
        }

        return Response.json({ intent });
    } catch (error) {
        console.error("Interpretation error:", error);
        return Response.json({ error: error.message }, { status: 500 });
    }
}
