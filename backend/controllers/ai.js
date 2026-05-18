import OpenAI from "openai";
import {
  isAiEnabled,
  openAiApiKey,
  openAiFallbackModel,
  openAiMaxRetries,
  openAiModel,
  openAiRetryDelayMs,
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

const sleep = (delayMs) =>
  new Promise((resolve) => {
    setTimeout(resolve, delayMs);
  });

const getErrorStatus = (error) =>
  error?.status || error?.response?.status || error?.statusCode;

const getRetryAfterDelayMs = (error) => {
  const retryAfterHeader =
    error?.headers?.["retry-after"] ||
    error?.response?.headers?.["retry-after"] ||
    error?.response?.headers?.get?.("retry-after");

  if (!retryAfterHeader) {
    return null;
  }

  const retryAfterSeconds = Number(retryAfterHeader);

  if (Number.isFinite(retryAfterSeconds) && retryAfterSeconds > 0) {
    return retryAfterSeconds * 1000;
  }

  return null;
};

const isRetryableOpenAiError = (error) => {
  const status = getErrorStatus(error);

  return [408, 409, 429, 500, 502, 503, 504].includes(status);
};

const requestAssistantReply = async ({
  model,
  instructions,
  transcript,
}) => {
  const response = await openai.responses.create({
    model,
    instructions,
    input: `Conversation so far:\n${transcript}\n\nReply as the assistant to the user's latest message.`,
    max_output_tokens: 500,
    reasoning: { effort: "low" },
  });

  const reply = response.output_text?.trim();

  if (!reply) {
    const emptyResponseError = new Error(
      "The AI assistant returned an empty response."
    );
    emptyResponseError.status = 502;
    throw emptyResponseError;
  }

  return {
    reply,
    model,
  };
};

const generateAssistantReply = async ({ instructions, transcript }) => {
  const attemptedModels = [
    openAiModel,
    openAiFallbackModel,
  ].filter((model, index, models) => Boolean(model) && models.indexOf(model) === index);

  let lastError = null;

  for (const model of attemptedModels) {
    for (let attempt = 0; attempt <= openAiMaxRetries; attempt++) {
      try {
        return await requestAssistantReply({
          model,
          instructions,
          transcript,
        });
      } catch (error) {
        lastError = error;

        if (!isRetryableOpenAiError(error) || attempt === openAiMaxRetries) {
          break;
        }

        const retryAfterDelayMs = getRetryAfterDelayMs(error);
        const backoffDelayMs =
          retryAfterDelayMs ??
          Math.round(openAiRetryDelayMs * Math.pow(2, attempt));

        await sleep(backoffDelayMs);
      }
    }
  }

  throw lastError;
};

const sendChatMessage = async (req, res) => {
  if (!isAiEnabled || !openai) {
    return res.status(503).json({
      message:
        "AI assistant is not configured yet. Add a real OPENAI_API_KEY to backend/.env to enable it.",
    });
  }

  try {
    const { messages, context } = req.body;
    const transcript = formatConversation(messages);
    const instructions = buildAssistantInstructions(req.user, context);
    const { reply, model } = await generateAssistantReply({
      instructions,
      transcript,
    });

    return res.status(200).json({
      reply,
      model,
    });
  } catch (error) {
    console.log("AI chat request failed:", error);

    if (error?.status === 401) {
      return res.status(502).json({
        message:
          "The configured OpenAI API key was rejected. Update OPENAI_API_KEY in backend/.env and restart the backend.",
      });
    }

    if (error?.status === 429) {
      return res.status(429).json({
        message:
          "The AI assistant is busy right now. We retried automatically, but the provider is still rate-limiting requests. Please wait a minute and try again.",
      });
    }

    if ([408, 409, 500, 502, 503, 504].includes(getErrorStatus(error))) {
      return res.status(503).json({
        message:
          "The AI assistant hit a temporary provider issue. We retried automatically, but it is still unavailable. Please try again in a moment.",
      });
    }

    return res.status(500).json({
      message: "Failed to generate an AI response.",
    });
  }
};

export { sendChatMessage };
