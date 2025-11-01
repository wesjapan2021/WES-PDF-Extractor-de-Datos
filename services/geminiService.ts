import { GoogleGenAI } from "@google/genai";
import { ExtractedRecord } from '../types';

// This is a placeholder for the API key.
// In a real application, this should be handled securely.
const apiKey = process.env.API_KEY;
if (!apiKey) {
    throw new Error("API_KEY environment variable not set");
}
const ai = new GoogleGenAI({ apiKey });

export const extractDataWithGemini = async (pdfText: string, userPrompt: string): Promise<ExtractedRecord[]> => {
  const model = "gemini-2.5-flash";
  
  const fullPrompt = `
    You are an expert data extraction assistant.
    Your task is to analyze the provided text content from a PDF document and extract the specific data requested by the user.
    The user wants to extract the following information: "${userPrompt}".

    Based on this request, extract the relevant data and format it as a JSON array of objects.
    Each object in the array should represent a single record or item.
    The keys of the objects should be descriptive column headers based on the user's request.
    The values should be the extracted data points.

    Here is the text from the PDF:
    ---
    ${pdfText}
    ---

    IMPORTANT: Only return a valid JSON array. Do not include any other text, explanations, or markdown formatting like \`\`\`json. Your entire response must be the JSON data itself. If no relevant data is found, return an empty array [].
  `;

  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: fullPrompt,
      config: {
        responseMimeType: "application/json",
        temperature: 0.2,
      }
    });
    
    let jsonText = response.text.trim();

    // Models can sometimes wrap JSON in markdown, let's clean it up.
    if (jsonText.startsWith('```json')) {
      jsonText = jsonText.slice(7, -3).trim();
    } else if (jsonText.startsWith('```')) {
      jsonText = jsonText.slice(3, -3).trim();
    }
    
    const data = JSON.parse(jsonText);

    if (!Array.isArray(data)) {
      throw new Error("API did not return a JSON array.");
    }

    return data as ExtractedRecord[];
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    if (error instanceof SyntaxError) {
      throw new Error("Failed to parse the data from the AI. The format was invalid. Please try a more specific prompt.");
    }
    if (error instanceof Error) {
        throw new Error(error.message || "An error occurred while extracting data. Please try again.");
    }
    throw new Error("An error occurred while extracting data. Please try again.");
  }
};