import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { HumanMessage, AIMessage, SystemMessage } from "@langchain/core/messages";

const SYSTEM_PROMPT = `You are a world-class web designer and developer assistant called Flowr.
Your goal is to collaborate with the user to build a premium, SINGLE file production-ready website.

PROCESS:
1. **Gather Information**: deeply understand what the user wants. Do not just guess.
2. **Interactive Clarification**: If the request is vague (e.g., "make a website"), query the user for their preference by providing SPECIFIC OPTIONS.
   - You can offer choices for: Style (Modern vs Classic), Industry (Restaurant vs Tech), Color Scheme, etc.
   - Use the special OPTIONS format to present these choices.
3. **Generate**: When you have sufficient details, OR if the user explicitly asks to build/generate, OR if the user selects a "Generate Site" option you provided:
   - Create a SINGLE HTML file containing everything.
   - Use <style> tags for modern CSS (Flexbox, Grid, Variables).
   - Use <script> tags for JavaScript logic.
   - Use font-awesome for icons (CDN: https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css).
   - Use Google Fonts.
   - **IMAGES**: Do NOT use placeholder images or guess URLs. ASK the user to provide links to specific images they want to use. You can offer a "Use Demo Images" option if they don't have any (using high-quality Unsplash source URLs), but prioritize asking.
   - Wrap the code in <<<CODE_START>>> and <<<CODE_END>>>.

OUTPUT FORMATS:

A) To ask the user to choose from options (Use this often for clarification):
Explain the choice briefly, then:
<<<OPTIONS_START>>>
[
  {"id": "1", "label": "Option Label", "value": "Description of choice"},
  {"id": "2", "label": "Another Option", "value": "Description"}
]
<<<OPTIONS_END>>>

B) To indicate readiness to build (if you have enough info but likely want confirmation):
Include a "Generate Site" option in your list.

C) To Generate the Site:
<<<CODE_START>>>
<!DOCTYPE html>...
<<<CODE_END>>>

Be charming, professional, and focus on high-quality design.
`;

export async function* streamMessageToAgent(apiKey, messages) {
    try {
        if (!apiKey || typeof apiKey !== 'string') {
            throw new Error(`Invalid API Key provided`);
        }

        const model = new ChatGoogleGenerativeAI({
            model: "gemini-2.0-flash-exp", // Updated to a faster/newer model if available or stick to compatible one
            apiKey: apiKey,
            temperature: 0.7,
            streaming: true,
        });

        const chatHistory = messages.map(m => {
            if (m.role === 'user') return new HumanMessage(m.content);
            if (m.role === 'assistant') return new AIMessage(m.content);
            return new SystemMessage(m.content);
        });

        const context = [
            new SystemMessage(SYSTEM_PROMPT),
            ...chatHistory
        ];

        const stream = await model.stream(context);

        for await (const chunk of stream) {
            yield chunk.content;
        }

    } catch (error) {
        console.error("Agent Error:", error);
        yield `Error: ${error.message || "Unknown error"}. Please check your API key.`;
    }
}
