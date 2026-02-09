import systems from './data/systems.json';
import { llmPromptToJson, llmFunctionCall } from './gemini';
import { Parser } from '@json2csv/plainjs';
import {
    stringQuoteOnlyIfNecessary as stringQuoteOnlyIfNecessaryFormatter,
    stringExcel as stringExcelFormatter,
} from '@json2csv/formatters';

const toCSV = (data) => {
    const CSVParser = new Parser({
        formatters: {
            string: stringQuoteOnlyIfNecessaryFormatter({ quote: '"' })
        }
    });
    return CSVParser.parse(data);
}

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

const SYSTEMS_CONTEXT = toCSV(systems.map(it => ({ id: it.id, name: it.name })));

const abbreviate = (id) => {
    return id
        .replace("stcmetro_", "A_")
        .replace("metrobus_", "B_")
        .replace("cablebus_", "C_")
        .replace("trolebus_", "D_")
        .replace("trenligero_", "E_")
        .replace("insur_", "F_");
}

const deabbreviate = (id) => {
    return id
        .replace("A_", "stcmetro_")
        .replace("B_", "metrobus_")
        .replace("C_", "cablebus_")
        .replace("D_", "trolebus_")
        .replace("E_", "trenligero_")
        .replace("F_", "insur_");
}

const dijkstraPrompt = (userPrompt, inputA, inputB, csv, costField = "time", costUnit = "seconds") => `Context: The user asked: "${userPrompt}"
From this list of edges in the included csv describing a graph, find the shortest path from "${inputA}" to "${inputB}", 
deliver the path and cost as an object inside the "options" array in a json object according to the schema

In the "foreword" field, provide a brief, helpful response to the user's specific request in Spanish.
Don't run code, don't explain technical details, just output the JSON object.

In the following list of edges, the cost value comes from the ${costField} field in units of ${costUnit}.

Here is the list of edges: 
${csv}`;

const extractRouteIntentPrompt = (userPrompt) => `Extract the travel origin, destination, and any specific transport systems mentioned.
    
IMPORTANT RULES:
1. DISTINGUISH between the station name and the system. If a user says "Metro Pantitlán", the station name is "Pantitlán" and the system is "stcmetro".
2. CLEAN station names: Remove transport system prefixes (Metro, Metrobús, etc.) from the station_query fields.
3. SYSTEMS: Only include systems explicitly mentioned or implied. If NO specific systems are mentioned, leave selected_systems empty.

Available Transport Systems:
${SYSTEMS_CONTEXT}

EXAMPLES:
- "The best route from Metro Buenavista to Pantitlán" -> origin: "Buenavista", destination: "Pantitlán", systems: "stcmetro"
- "Fastest way from El Caminero to Pino Suarez but use only metro and metrobús" -> origin: "El Caminero", destination: "Pino Suarez", systems: ["stcmetro", "metrobus"]
- "Go to Xola from here" -> destination: "Xola", origin: "current location" (or similar)

User Query: "${userPrompt}"`;

const toCSVEdges = (edges, field = "time") => toCSV(
    edges.map(it => ({
        station1: abbreviate(it.node1),
        station2: abbreviate(it.node2),
        [field]: it[field]
    }))
);

const defaultRoutePrompt = (origin, destination) => `Find route from ${origin} to ${destination}`;

const findRoutePrompt = (origin, destination, edges, userPrompt = "") => dijkstraPrompt(
    userPrompt || defaultRoutePrompt(origin, destination),
    abbreviate(origin),
    abbreviate(destination),
    toCSVEdges(edges, "time"),
    "time",
    "seconds"
)

const expandPaths = (pathList) => {
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

    return expandedList.map(deabbreviate);
}

export async function promptToIntent(userPrompt) {
    const content = extractRouteIntentPrompt(userPrompt);
    const tool = FIND_ROUTE_TOOL;
    const { value: args, error } = await llmFunctionCall(content, tool);

    if (error) return { value: null, error };
    if (!args) return { value: null, error: "No intent discovered." };

    if (args.selected_systems && !Array.isArray(args.selected_systems)) {
        args.selected_systems = [args.selected_systems];
    }
    return { value: args, error: null };
}

export async function findRoute(origin, destination, edges, userPrompt = "", thinkingLevel = "low") {
    const content = findRoutePrompt(origin, destination, edges, userPrompt);
    const { value: parsed, error } = await llmPromptToJson(content, SCHEMA, thinkingLevel);

    if (error) return { value: null, error };
    if (!parsed) return { value: null, error: "Failed to parse route from AI." };

    console.log("parsed", parsed);
    const optionsList = Array.isArray(parsed.options) ? parsed.options : [];
    const enrichedOptions = optionsList.map(option => ({
        ...option,
        path: (option.path || []).map(deabbreviate)
    }));

    return {
        value: {
            foreword: parsed.foreword,
            options: enrichedOptions
        },
        error: null
    };
}
