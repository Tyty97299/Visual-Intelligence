import { GoogleGenAI, Type } from "@google/genai";

const apiKey = process.env.API_KEY;
if (!apiKey) {
  console.error("API_KEY is missing from environment variables.");
}

const ai = new GoogleGenAI({ apiKey: apiKey || '' });

/**
 * Analyzes the image to generate a Smart Card (identification) and Suggestions.
 */
export const analyzeImage = async (base64Image: string): Promise<{ smartCard: any, suggestions: string[] }> => {
  try {
    const cleanBase64 = base64Image.replace(/^data:image\/(png|jpeg|jpg|webp);base64,/, '');

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: {
        parts: [
          { text: `Analyze this image precisely.
            Return a JSON object with:
            1. "title": The specific name of the object, landmark, or subject (e.g., "iPhone 14 Pro", "Eiffel Tower", "Monstera Deliciosa").
            2. "description": A concise, 1-sentence description.
            3. "facts": An array of 3-4 key technical or historical facts (label/value pairs).
            4. "suggestions": 3 distinct, short questions a user might ask about this.
            ` },
          {
            inlineData: {
              mimeType: 'image/jpeg',
              data: cleanBase64
            }
          }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            description: { type: Type.STRING },
            facts: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  label: { type: Type.STRING },
                  value: { type: Type.STRING }
                }
              }
            },
            suggestions: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            }
          }
        }
      }
    });

    const jsonStr = response.text || "{}";
    const data = JSON.parse(jsonStr);
    
    return {
      smartCard: {
        title: data.title || "Unknown Object",
        description: data.description || "Analysis incomplete.",
        facts: data.facts || []
      },
      suggestions: data.suggestions || ["What is this?", "Tell me more", "Search for details"]
    };

  } catch (error) {
    console.error("Analysis Failed:", error);
    return {
      smartCard: {
        title: "Analysis Error",
        description: "Could not identify object.",
        facts: []
      },
      suggestions: ["Retry analysis", "What is this?"]
    };
  }
};

/**
 * Answers a specific question about the image using Google Search grounding.
 */
export const askAboutImage = async (base64Image: string, question: string) => {
  try {
    const cleanBase64 = base64Image.replace(/^data:image\/(png|jpeg|jpg|webp);base64,/, '');

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: {
        parts: [
          { text: `Answer this question about the image. Be extremely brief, concise, and direct. Max 2-3 sentences. Question: ${question}` },
          {
            inlineData: {
              mimeType: 'image/jpeg',
              data: cleanBase64
            }
          }
        ]
      },
      config: {
        tools: [{ googleSearch: {} }]
      }
    });

    const text = response.candidates?.[0]?.content?.parts?.map(p => p.text).join('') || "I couldn't find an answer.";
    
    // Extract grounding metadata (search links)
    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    const links = groundingChunks
      .map((chunk: any) => chunk.web ? { title: chunk.web.title, uri: chunk.web.uri } : null)
      .filter((link: any) => link !== null);

    return {
      text,
      links
    };

  } catch (error) {
    console.error("Q&A Failed:", error);
    throw error;
  }
};