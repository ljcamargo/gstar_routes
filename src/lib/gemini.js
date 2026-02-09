import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI(process.env.GEMINI_API_KEY || "");
const MODEL = "gemini-3-flash-preview";

export async function llmPromptToJson(content, schema, thinkingLevel = "low") {
    console.log("llmPromptToJson Content: ", content);
    const total_tokens = await ai.models.countTokens({
        model: MODEL,
        contents: content,
    });
    console.log("llmPromptToJson Tokens: ", total_tokens);
    const result = await ai.models.generateContent({
        model: MODEL,
        contents: content,
        config: {
            thinkingConfig: {
                thinkingLevel,
            },
            responseMimeType: "application/json",
            responseJsonSchema: schema
        }
    });
    console.log("Gemini result", result.text);
    const text = result.text;
    try {
        let parsed = JSON.parse(text);
        return parsed;
    } catch (e) {
        console.error("Failed to parse Gemini response", text);
        throw e;
    }
}

export async function llmFunctionCall(content, tool) {
    console.log("llmFunctionCall Content: ", content);
    const result = await ai.models.generateContent({
        model: MODEL,
        contents: content,
        config: {
            tools: [{ functionDeclarations: [tool] }]
        }
    });
    if (result.functionCalls && result.functionCalls.length > 0) {
        console.log("Gemini result", JSON.stringify(result.functionCalls, null, 2));
        return result.functionCalls[0].args;
    }
    return null;
}