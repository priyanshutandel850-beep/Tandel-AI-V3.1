import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { Attachment, Role } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const streamGeminiResponse = async (
  message: string,
  attachments: Attachment[],
  history: { role: string; parts: { text: string }[] }[],
  onChunk: (text: string) => void
) => {
  try {
    // Ensure we are using the Gemini 2.5 Flash model
    const modelId = 'gemini-2.5-flash';

    const chat = ai.chats.create({
      model: modelId,
      history: history,
      config: {
        systemInstruction: `You are Tandel AI, a helpful, harmless, and honest AI assistant. 

IMPORTANT RULES:
- Always respond in complete, well-formed sentences
- Never give one-word or echo responses
- If user says "hello", respond with a friendly greeting like "Hello! How can I assist you today?"
- If user asks "how are you", respond with "As an AI, I don't have feelings, but I'm ready to assist you! What can I help you with?"
- Provide informative, conversational responses
- Use Markdown for formatting when appropriate
- Be friendly, helpful, and engaging`,
      },
    });

    // Prepare parts
    const parts: any[] = [];
    
    // Add attachments first (images)
    if (attachments && attachments.length > 0) {
      attachments.forEach(att => {
        // Strip the data url prefix to get raw base64
        const base64Data = att.base64.split(',')[1];
        parts.push({
          inlineData: {
            mimeType: att.mimeType,
            data: base64Data
          }
        });
      });
    }

    // Add text prompt
    if (message) {
      parts.push({ text: message });
    }

    // Use sendMessageStream for chat context
    const result = await chat.sendMessageStream({ 
        message: parts.length === 1 && parts[0].text ? parts[0].text : parts 
    });

    let fullText = '';
    for await (const chunk of result) {
      const c = chunk as GenerateContentResponse;
      if (c.text) {
        fullText += c.text;
        onChunk(fullText);
      }
    }

    return fullText;

  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};

export const generateTitle = async (firstMessage: string): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Generate a very short (3-5 words) title for a chat that starts with: "${firstMessage}". Do not use quotes.`,
    });
    return response.text?.trim() || "New Chat";
  } catch (e) {
    return "New Chat";
  }
}