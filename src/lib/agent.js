import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { HumanMessage, AIMessage, SystemMessage } from "@langchain/core/messages";

const SYSTEM_PROMPT = `You are a world-class web designer and developer assistant called Flowr.
Your goal is to create a SINGLE file production-ready website for the user based on their requirements.

CRITICAL INSTRUCTION: FORCE A BUILDING SESSION.
If the user mentions a type of website (e.g., "pizza site", "portfolio", "landing page"), you MUST GENERATE THE COMPLETE CODE IMMEDIATELY.
Do NOT ask questions about design or features. Make your best professional decisions for a premium result.
Only ask questions if the user's request is completely empty or unintelligible.

When generating code:
- Create a SINGLE HTML file containing everything.
- Use <style> tags for CSS. Use modern CSS (Flexbox, Grid, Variables). Make it beautiful.
- Use <script> tags for JavaScript.
- Use font-awesome for icons if needed (CDN: https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css).
- Use Google Fonts (Inter, Roboto, etc.).
- Ensure the design is responsive and looks premium.
- WRAP THE CODE IN SPECIAL MARKERS: 
  <<<CODE_START>>>
  <!DOCTYPE html>...
  <<<CODE_END>>>

If the user asks to change something after the code is generated, regenerate the whole file with changes and wrap it in the markers again.
`;

export async function sendMessageToAgent(apiKey, messages, userMessageContent) {
    try {
        if (!apiKey || typeof apiKey !== 'string') {
            throw new Error(`Invalid API Key provided: ${typeof apiKey}`);
        }
        console.log("Initializing Agent with Key length:", apiKey.length);

        const model = new ChatGoogleGenerativeAI({
            model: "gemini-2.5-pro",
            apiKey: apiKey,
            temperature: 0.7,
        });

        const chatHistory = messages.map(m => {
            if (m.role === 'user') return new HumanMessage(m.content);
            if (m.role === 'assistant') return new AIMessage(m.content);
            return new SystemMessage(m.content);
        });

        // Add current user message
        // Note: In the React app, we usually add the user message to state first, code passes 'messages' including the new one?
        // Let's assume 'messages' passed here DOES NOT include the latest user message yet, or we handle it carefully.
        // Actually, usually we append the new message to history.

        // Let's assume the caller appends the user message to the UI state, and passes the WHOLE history including the new user message to this function.
        // If the last message in 'messages' is the user's new message, we just use 'messages'.

        // However, to be safe, I'll rely on the caller to pass the full conversation history including the latest user prompt.
        // But wait, the System Prompt should be at the start.

        const context = [
            new SystemMessage(SYSTEM_PROMPT),
            ...chatHistory
        ];

        const response = await model.invoke(context);
        const content = typeof response.content === 'string' ? response.content : "";

        let code = null;
        let textResponse = content;

        // Extract code if present
        const codeStart = content.indexOf("<<<CODE_START>>>");
        const codeEnd = content.indexOf("<<<CODE_END>>>");

        if (codeStart !== -1 && codeEnd !== -1) {
            code = content.substring(codeStart + 16, codeEnd).trim();
            // Remove the code block from the text response shown to user, or keep it?
            // Usually users want to see "Here is your site..." but not the raw HTML blob.
            // let's strip the code block for the chat bubble.
            textResponse = content.substring(0, codeStart) + "\n\n(Website generated and updated in preview)" + content.substring(codeEnd + 14);
        }

        return {
            content: textResponse,
            code: code
        };

    } catch (error) {
        console.error("Agent Error:", error);
        return {
            content: `Error: ${error.message || "Unknown error"}. Please check your API key.`,
            code: null
        };
    }
}
