/**
 * LLM-based route finding logic using Gemini API.
 */

const SCHEMA = {
    "type": "array",
    "items": {
        "type": "object",
        "properties": {
            "name": { "type": "string" },
            "cost": { "type": "integer" },
            "path": {
                "type": "array",
                "items": { "type": "string" }
            }
        },
        "required": ["name", "cost", "path"]
    }
};

const PROMPT_TEMPLATE = `From this list of edges in the included csv describing a graph, find the shortest path from "%INPUT_A%" to "%INPUT_B%", deliver the path and cost as an object inside a json array according to this schema:
%SCHEMA%

Don't run code, don't explain, just output the shortest path and the calculated cost in the json object and say nothing nor explain anything else. 

Here is the list of edges: 
station1, station2, cost
%DATA%`;

function abbreviateEdges(id) {
    return id
        .replace("stcmetro_", "A_")
        .replace("metrobus_", "B_")
        .replace("cablebus_", "C_")
        .replace("trolebus_", "D_")
        .replace("trenligero_", "E_");
}

function deAbbreviateEdges(id) {
    return id
        .replace("A_", "stcmetro_")
        .replace("B_", "metrobus_")
        .replace("C_", "cablebus_")
        .replace("D_", "trolebus_")
        .replace("E_", "trenligero_");
}

function expandPaths(pathList) {
    const expandedList = [];

    for (const item of pathList) {
        const rangeMatch = /^(.+?)\.\.\.(.+?)$/.exec(item);
        if (rangeMatch) {
            const [_, start, end] = rangeMatch;
            const [prefix, startSuffix] = start.split("_");
            const endSuffix = end.split("_").pop();

            const startNum = parseInt(startSuffix, 10);
            const endNum = parseInt(endSuffix, 10);

            if (!isNaN(startNum) && !isNaN(endNum)) {
                const step = startNum <= endNum ? 1 : -1;
                for (let num = startNum; ; num += step) {
                    const formattedNum = num.toString().padStart(2, '0');
                    expandedList.push(`${prefix}_${formattedNum}`);
                    if (num === endNum) break;
                }
            }
        } else {
            expandedList.push(item);
        }
    }

    return expandedList.map(deAbbreviateEdges);
}

export async function findRouteWithGemini(origin, destination, edges) {
    const csvData = edges.map(e => `${abbreviateEdges(e.node1)},${abbreviateEdges(e.node2)},${e.time}`).join('\n');

    const prompt = PROMPT_TEMPLATE
        .replace("%SCHEMA%", JSON.stringify(SCHEMA, null, 2))
        .replace("%INPUT_A%", abbreviateEdges(origin))
        .replace("%INPUT_B%", abbreviateEdges(destination))
        .replace("%DATA%", csvData);

    console.log(prompt);

    // In a real implementation, you would use the Gemini SDK here.
    // For this MVP, we'll assume an environment variable GEMINI_API_KEY is available.
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        throw new Error("GEMINI_API_KEY is not defined");
    }

    // Gemini API call (Simplified for MVP)
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-lite-latest:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { responseMimeType: "application/json" }
        })
    });

    const result = await response.json();
    console.log(result);
    const text = result.candidates[0].content.parts[0].text;

    try {
        const parsed = JSON.parse(text);
        return parsed.map(option => ({
            ...option,
            path: expandPaths(option.path)
        }));
    } catch (e) {
        console.error("Failed to parse Gemini response", text);
        throw e;
    }
}
