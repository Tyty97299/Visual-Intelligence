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
          { text: `Analyze this image.
            1. STRICT ENTITY DETECTION: Determine if this image depicts a SPECIFIC, WELL-KNOWN entity.
               - Examples of Entities: "Eiffel Tower", "Mona Lisa", "iPhone 15", "Tesla Model S", "Monstera Deliciosa", "Barack Obama".
               - Examples of Non-Entities (Generic): "A wooden table", "A generic laptop", "A random dog", "A selfie of a random person", "A street view", "A math problem", "A book page".
            2. If it is GENERIC, set "isEntity" to FALSE. Do NOT generate a card for generic items.
            3. If it is a SPECIFIC ENTITY, set "isEntity" to TRUE and provide details.
            4. Always provide 3 distinct, short, relevant questions in "suggestions" tailored to the content (e.g., if math, ask for solution; if plant, ask for care tips).
            
            Return JSON.` },
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
            isEntity: { type: Type.BOOLEAN },
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
    
    // Only return smartCard if it is a specific entity
    const smartCard = data.isEntity ? {
        title: data.title || "Identified Object",
        description: data.description || "",
        facts: data.facts || []
    } : null;

    return {
      smartCard,
      suggestions: data.suggestions || ["What is this?", "Describe this", "More details"]
    };

  } catch (error) {
    console.error("Analysis Failed:", error);
    return {
      smartCard: null,
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
          { text: `Answer this question about the image. Be extremely brief, concise, and direct. Max 2 short sentences. Question: ${question}` },
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