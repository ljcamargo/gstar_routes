import { promptToIntent } from '@/lib/aidijkstra';

export async function POST(request) {
    try {
        const { prompt } = await request.json();

        if (!prompt) {
            return Response.json({ error: "Prompt is required" }, { status: 400 });
        }

        const { value: intent, error } = await promptToIntent(prompt);

        if (error) {
            return Response.json({ error });
        }

        return Response.json({ intent });
    } catch (error) {
        console.error("Interpretation error:", error);
        return Response.json({ error: "An unexpected server error occurred." });
    }
}
