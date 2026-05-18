import dotenv from "dotenv";

dotenv.config();

const normalizeEnvValue = (value) => {
  if (typeof value !== "string") {
    return value;
  }

  const trimmedValue = value.trim();

  if (
    (trimmedValue.startsWith("'") && trimmedValue.endsWith("'")) ||
    (trimmedValue.startsWith('"') && trimmedValue.endsWith('"'))
  ) {
    return trimmedValue.slice(1, -1).trim();
  }

  return trimmedValue;
};

const normalizeEnvKey = (key) => {
  const normalizedValue = normalizeEnvValue(process.env[key]);

  if (typeof normalizedValue === "string") {
    process.env[key] = normalizedValue;
  }

  return normalizedValue;
};

const isPlaceholderSecret = (value) => {
  if (typeof value !== "string") {
    return false;
  }

  const normalizedValue = value.trim().toLowerCase();

  if (!normalizedValue) {
    return false;
  }

  return (
    normalizedValue.startsWith("your_") ||
    normalizedValue.startsWith("your-") ||
    normalizedValue.startsWith("your ") ||
    normalizedValue.startsWith("replace-with") ||
    normalizedValue.includes("example") ||
    normalizedValue.includes("placeholder")
  );
};

normalizeEnvKey("PORT");
normalizeEnvKey("MONGODB_URI");
normalizeEnvKey("JWT_SECRET");
normalizeEnvKey("FRONTEND_URL");
normalizeEnvKey("SEND_GRID_API");
normalizeEnvKey("FROM_EMAIL");
normalizeEnvKey("ARCJET_ENV");
normalizeEnvKey("ARCJET_KEY");
normalizeEnvKey("OPENAI_API_KEY");
normalizeEnvKey("OPENAI_MODEL");
normalizeEnvKey("OPENAI_FALLBACK_MODEL");
normalizeEnvKey("OPENAI_MAX_RETRIES");
normalizeEnvKey("OPENAI_RETRY_DELAY_MS");

export const nodeEnv = normalizeEnvKey("NODE_ENV") || "development";
export const isProduction = nodeEnv === "production";
export const isDevelopment = !isProduction;
export const sendGridApiKey = normalizeEnvKey("SEND_GRID_API");
export const fromEmail = normalizeEnvKey("FROM_EMAIL");
export const arcjetKey = normalizeEnvKey("ARCJET_KEY");
export const openAiApiKey = normalizeEnvKey("OPENAI_API_KEY");
export const openAiModel = normalizeEnvKey("OPENAI_MODEL") || "gpt-5-mini";
export const openAiFallbackModel = normalizeEnvKey("OPENAI_FALLBACK_MODEL");
export const openAiMaxRetries = Math.max(
  Number(normalizeEnvKey("OPENAI_MAX_RETRIES")) || 2,
  0
);
export const openAiRetryDelayMs = Math.max(
  Number(normalizeEnvKey("OPENAI_RETRY_DELAY_MS")) || 1500,
  250
);
export const isEmailEnabled = Boolean(sendGridApiKey && fromEmail);
export const isArcjetEnabled = Boolean(arcjetKey);
export const isAiEnabled = Boolean(
  openAiApiKey && !isPlaceholderSecret(openAiApiKey)
);
export const shouldBypassEmail = isDevelopment && !isEmailEnabled;
export const shouldBypassArcjet = isDevelopment && !isArcjetEnabled;
