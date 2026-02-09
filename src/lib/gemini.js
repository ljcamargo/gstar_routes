import { GoogleGenAI } from "@google/genai";

const MODEL = "gemini-3-flash-preview";

const getAIClient = (apiKey) => {
    const key = apiKey || process.env.GEMINI_API_KEY || "";
    return new GoogleGenAI(key);
};

export async function llmPromptToJson(content, schema, thinkingLevel = "low", apiKey = null) {
    console.log("llmPromptToJson Content: ", content);
    try {
        const ai = getAIClient(apiKey);
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
            let value = JSON.parse(text);
            return { value, error: null };
        } catch (e) {
            console.error("Failed to parse Gemini response", text);
            return { value: null, error: "Failed to parse AI response as JSON." };
        }
    } catch (error) {
        console.error("Gemini API Error (llmPromptToJson):", error);
        let message = `AI Service Error: ${error.message || "Unknown error"}`;
        if (error.status === 429) {
            message = "Gemini quota exceeded. Please try again in a minute.";
        } else if (error.message?.includes("API key not valid")) {
            message = "The provided Gemini API key is invalid.";
        }
        return { value: null, error: message };
    }
}

export async function llmFunctionCall(content, tool, apiKey = null) {
    console.log("llmFunctionCall Content: ", content);
    try {
        const ai = getAIClient(apiKey);
        const result = await ai.models.generateContent({
            model: MODEL,
            contents: content,
            config: {
                tools: [{ functionDeclarations: [tool] }]
            }
        });

        if (result.functionCalls && result.functionCalls.length > 0) {
            console.log("Gemini result", JSON.stringify(result.functionCalls, null, 2));
            return { value: result.functionCalls[0].args, error: null };
        }

        return { value: null, error: "AI could not determine intent from this prompt." };
    } catch (error) {
        console.error("Gemini API Error (llmFunctionCall):", error);
        let message = `AI Intent Error: ${error.message || "Unknown error"}`;
        if (error.status === 429) {
            message = "Gemini quota exceeded. Please try again in a minute.";
        } else if (error.message?.includes("API key not valid")) {
            message = "The provided Gemini API key is invalid.";
        }
        return { value: null, error: message };
    }
}