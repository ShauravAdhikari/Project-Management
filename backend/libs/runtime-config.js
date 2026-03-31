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

export const nodeEnv = normalizeEnvKey("NODE_ENV") || "development";
export const isProduction = nodeEnv === "production";
export const isDevelopment = !isProduction;
export const sendGridApiKey = normalizeEnvKey("SEND_GRID_API");
export const fromEmail = normalizeEnvKey("FROM_EMAIL");
export const arcjetKey = normalizeEnvKey("ARCJET_KEY");
export const openAiApiKey = normalizeEnvKey("OPENAI_API_KEY");
export const openAiModel = normalizeEnvKey("OPENAI_MODEL") || "gpt-5-mini";
export const isEmailEnabled = Boolean(sendGridApiKey && fromEmail);
export const isArcjetEnabled = Boolean(arcjetKey);
export const isAiEnabled = Boolean(openAiApiKey);
export const shouldBypassEmail = isDevelopment && !isEmailEnabled;
export const shouldBypassArcjet = isDevelopment && !isArcjetEnabled;
