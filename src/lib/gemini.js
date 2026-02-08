import { GoogleGenAI } from "@google/genai";

import systems from './data/systems.json';

const ai = new GoogleGenAI(process.env.GEMINI_API_KEY || "");

/**
 * LLM-based route finding logic using Gemini API.
 */

const SCHEMA = {
    "type": "object",
    "properties": {
        "foreword": {
            "type": "string",
            "description": "A brief user-friendly response or explanation of the route found."
        },
        "options": {
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
        }
    },
    "required": ["foreword", "options"]
};

const PROMPT_TEMPLATE = `Context: The user asked: "%USER_PROMPT%"
From this list of edges in the included csv describing a graph, find the shortest path from "%INPUT_A%" to "%INPUT_B%", deliver the path and cost as an object inside the "options" array in a json object according to this schema:
%SCHEMA%

In the "foreword" field, provide a brief, helpful response to the user's specific request in Spanish.
Don't run code, don't explain technical details, just output the JSON object.

Here is the list of edges: 
station1, station2, cost
%DATA%`;

const FIND_ROUTE_TOOL = {
    name: "find_route",
    description: "Extracts origin, destination, and preferred systems from a natural language transport query.",
    parameters: {
        type: "object",
        properties: {
            origin_query: { type: "string", description: "The starting station or location mentioned by the user." },
            destination_query: { type: "string", description: "The destination station or location mentioned by the user." },
            selected_systems: {
                type: "array",
                items: { type: "string" },
                description: "List of system IDs to use (stcmetro, metrobus, cablebus, trolebus, trenligero, insur)."
            }
        },
        required: ["origin_query", "destination_query"]
    }
};

/**
 * Extracts structured intent from a natural language prompt.
 */
export async function extractRouteIntent(userPrompt) {
    const systemsContext = systems.map(s => `- ${s.name} (ID: ${s.id})`).join('\n');

    const instruction = `Extract the travel origin, destination, and any specific transport systems mentioned.
    
IMPORTANT RULES:
1. DISTINGUISH between the station name and the system. If a user says "Metro Pantitlán", the station name is "Pantitlán" and the system is "stcmetro".
2. CLEAN station names: Remove transport system prefixes (Metro, Metrobús, etc.) from the station_query fields.
3. SYSTEMS: Only include systems explicitly mentioned or implied. If NO specific systems are mentioned, leave selected_systems empty.

Available Transport Systems:
${systemsContext}

EXAMPLES:
- "The best route from Metro Buenavista to Pantitlán" -> origin: "Buenavista", destination: "Pantitlán", systems: "stcmetro"
- "Fastest way from El Caminero to Pino Suarez but use only metro and metrobús" -> origin: "El Caminero", destination: "Pino Suarez", systems: ["stcmetro", "metrobus"]
- "Go to Xola from here" -> destination: "Xola", origin: "current location" (or similar)

User Query: "${userPrompt}"`;

    const result = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: instruction,
        config: {
            tools: [{ functionDeclarations: [FIND_ROUTE_TOOL] }]
        }
    });

    if (result.functionCalls && result.functionCalls.length > 0) {
        console.log("Gemini result", JSON.stringify(result.functionCalls, null, 2));
        const args = result.functionCalls[0].args;

        // Ensure selected_systems is an array
        if (args.selected_systems && !Array.isArray(args.selected_systems)) {
            args.selected_systems = [args.selected_systems];
        }

        return args;
    }
    return null;
}

function abbreviateEdges(id) {
    return id
        .replace("stcmetro_", "A_")
        .replace("metrobus_", "B_")
        .replace("cablebus_", "C_")
        .replace("trolebus_", "D_")
        .replace("trenligero_", "E_")
        .replace("insur_", "F_");
}

function deAbbreviateEdges(id) {
    return id
        .replace("A_", "stcmetro_")
        .replace("B_", "metrobus_")
        .replace("C_", "cablebus_")
        .replace("D_", "trolebus_")
        .replace("E_", "trenligero_")
        .replace("F_", "insur_");
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

export async function findRouteWithGemini(origin, destination, edges, userPrompt = "") {
    const csvData = edges.map(e => `${abbreviateEdges(e.node1)},${abbreviateEdges(e.node2)},${e.time}`).join('\n');

    const prompt = PROMPT_TEMPLATE
        .replace("%USER_PROMPT%", userPrompt || `Find route from ${origin} to ${destination}`)
        .replace("%SCHEMA%", JSON.stringify(SCHEMA, null, 2))
        .replace("%INPUT_A%", abbreviateEdges(origin))
        .replace("%INPUT_B%", abbreviateEdges(destination))
        .replace("%DATA%", csvData);

    const result = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
            thinkingConfig: {
                thinkingLevel: "low",
            },
            responseMimeType: "application/json"
        }
    });

    console.log("Gemini result", result.text);
    const text = result.text;

    try {
        let parsed = JSON.parse(text);

        // Handle case where Gemini wraps the response in an array
        if (Array.isArray(parsed) && parsed.length > 0) {
            // Some models might return an array of route options directly if the prompt was ambiguous
            // but we expect { foreword, options }
            if (parsed[0].foreword || parsed[0].options) {
                parsed = parsed[0];
            } else {
                // If it's just an array of options, wrap it
                parsed = {
                    foreword: "Aquí tienes algunas opciones de ruta.",
                    options: parsed
                };
            }
        }

        // Map options and expand paths
        const optionsList = Array.isArray(parsed.options) ? parsed.options : [];
        const enrichedOptions = optionsList.map(option => ({
            ...option,
            path: expandPaths(option.path || [])
        }));

        return {
            foreword: parsed.foreword || "Ruta calculada con éxito.",
            options: enrichedOptions
        };
    } catch (e) {
        console.error("Failed to parse Gemini response", text);
        throw e;
    }
}
