import arcjet, {
  detectBot,
  shield,
  tokenBucket,
  validateEmail,
} from "@arcjet/node";
import { arcjetKey, shouldBypassArcjet } from "./runtime-config.js";

const allowRequestDecision = {
  isDenied: () => false,
};

const createBypassArcjet = () => ({
  protect: async () => allowRequestDecision,
});

const aj = arcjetKey
  ? arcjet({
      // Get your site key from https://app.arcjet.com and set it as an environment
      // variable rather than hard coding.
      key: arcjetKey,
      characteristics: ["ip.src"], // Track requests by IP
      rules: [
        // Shield protects your app from common attacks e.g. SQL injection
        shield({ mode: "LIVE" }),
        // Create a bot detection rule
        detectBot({
          mode: "LIVE", // Blocks requests. Use "DRY_RUN" to log only
          // Block all bots except the following
          allow: [
            "CATEGORY:SEARCH_ENGINE", // Google, Bing, etc
            // Uncomment to allow these other common bot categories
            // See the full list at https://arcjet.com/bot-list
            //"CATEGORY:MONITOR", // Uptime monitoring services
            //"CATEGORY:PREVIEW", // Link previews e.g. Slack, Discord
          ],
        }),
        validateEmail({
          mode: "LIVE", // will block requests. Use "DRY_RUN" to log only
          // block disposable, invalid, and email addresses with no MX records
          deny: ["DISPOSABLE", "INVALID", "NO_MX_RECORDS"],
        }),
        // Create a token bucket rate limit. Other algorithms are supported.
        tokenBucket({
          mode: "LIVE",
          refillRate: 5, // Refill 5 tokens per interval
          interval: 10, // Refill every 10 seconds
          capacity: 10, // Bucket capacity of 10 tokens
        }),
      ],
    })
  : shouldBypassArcjet
  ? createBypassArcjet()
  : (() => {
      throw new Error("ARCJET_KEY is required in production.");
    })();

if (shouldBypassArcjet) {
  console.log(
    "Arcjet is disabled in development because ARCJET_KEY is not configured."
  );
}

export default aj;
