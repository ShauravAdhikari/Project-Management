import OpenAI from "openai";
import {
  isAiEnabled,
  openAiApiKey,
  openAiModel,
} from "../libs/runtime-config.js";

const openai = isAiEnabled
  ? new OpenAI({
      apiKey: openAiApiKey,
    })
  : null;

const buildAssistantInstructions = (user, context = {}) => {
  const workspaceName = context.workspaceName || "No workspace selected";
  const currentPath = context.currentPath || "unknown";
  const pageTitle = context.pageTitle || "unknown";

  return `You are the Yutani Foundation assistant inside a project management web app.

Your job is to help the signed-in user navigate the app, understand what they can do on the current page, plan projects, break work into tasks, draft project updates, and give concise productivity advice.

Rules:
- Be practical, concise, and helpful.
- Focus on project management, task planning, and app guidance.
- Do not claim you changed data, created tasks, invited users, or updated the database.
- If the user asks you to do something in the app, explain the steps they should take.
- If the current page context is limited, say so briefly and still help with the information available.
- Prefer short paragraphs or small lists.

Signed-in user:
- Name: ${user.name}
- Email: ${user.email}

Current app context:
- Selected workspace: ${workspaceName}
- Current path: ${currentPath}
- Page title: ${pageTitle}`;
};

const formatConversation = (messages) =>
  messages
    .slice(-12)
    .map((message) => {
      const speaker = message.role === "assistant" ? "Assistant" : "User";
      return `${speaker}: ${message.content.trim()}`;
    })
    .join("\n\n");

const sendChatMessage = async (req, res) => {
  if (!isAiEnabled || !openai) {
    return res.status(503).json({
      message:
        "AI assistant is not configured yet. Add OPENAI_API_KEY to backend/.env to enable it.",
    });
  }

  try {
    const { messages, context } = req.body;
    const transcript = formatConversation(messages);

    const response = await openai.responses.create({
      model: openAiModel,
      instructions: buildAssistantInstructions(req.user, context),
      input: `Conversation so far:\n${transcript}\n\nReply as the assistant to the user's latest message.`,
      max_output_tokens: 500,
      reasoning: { effort: "low" },
    });

    const reply = response.output_text?.trim();

    if (!reply) {
      return res.status(502).json({
        message: "The AI assistant returned an empty response.",
      });
    }

    return res.status(200).json({
      reply,
      model: openAiModel,
    });
  } catch (error) {
    console.log("AI chat request failed:", error);

    return res.status(500).json({
      message: "Failed to generate an AI response.",
    });
  }
};

export { sendChatMessage };
