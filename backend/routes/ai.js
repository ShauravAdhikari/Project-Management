import express from "express";
import { validateRequest } from "zod-express-middleware";
import { z } from "zod";
import authMiddleware from "../middleware/auth-middleware.js";
import { sendChatMessage } from "../controllers/ai.js";

const aiChatSchema = z.object({
  messages: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z
          .string()
          .trim()
          .min(1, "Message content is required")
          .max(2000, "Message is too long"),
      })
    )
    .min(1, "At least one message is required")
    .max(12, "Too many messages were sent"),
  context: z
    .object({
      currentPath: z.string().trim().max(200).optional(),
      workspaceName: z.string().trim().max(120).optional(),
      pageTitle: z.string().trim().max(120).optional(),
    })
    .optional(),
});

const router = express.Router();

router.post(
  "/chat",
  authMiddleware,
  validateRequest({ body: aiChatSchema }),
  sendChatMessage
);

export default router;
