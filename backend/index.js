import { isDevelopment } from "./libs/runtime-config.js";
import cors from "cors";
import express from "express";
import mongoose from "mongoose";
import morgan from "morgan";

import routes from "./routes/index.js";

const app = express();
const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";

const isAllowedDevelopmentOrigin = (origin) =>
  /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(origin);

app.use(
  cors({
    origin(origin, callback) {
      if (!origin) {
        return callback(null, true);
      }

      if (origin === frontendUrl) {
        return callback(null, true);
      }

      if (isDevelopment && isAllowedDevelopmentOrigin(origin)) {
        return callback(null, true);
      }

      return callback(new Error(`CORS blocked for origin: ${origin}`));
    },
    methods: ["GET", "POST", "DELETE", "PUT"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.use(morgan("dev"));

app.use(express.json());

const PORT = process.env.PORT || 5000;
const dbStateLabels = {
  0: "disconnected",
  1: "connected",
  2: "connecting",
  3: "disconnecting",
};

app.get("/", async (req, res) => {
  res.status(200).json({
    message: "Welcome to Yutani Foundation API",
  });
});

app.get("/health", (req, res) => {
  const readyState = mongoose.connection.readyState;
  const databaseStatus = dbStateLabels[readyState] || "unknown";
  const isHealthy = readyState === 1;

  return res.status(isHealthy ? 200 : 503).json({
    status: isHealthy ? "ok" : "degraded",
    service: "yutani-foundation-api",
    environment: process.env.NODE_ENV || "development",
    database: databaseStatus,
    timestamp: new Date().toISOString(),
  });
});
// http:localhost:500/api-v1/
app.use("/api-v1", routes);

// error middleware
app.use((err, req, res, next) => {
  console.log(err.stack);
  res.status(500).json({ message: "Internal server error" });
});

// not found middleware
app.use((req, res) => {
  res.status(404).json({
    message: "Not found",
  });
});

const startServer = async () => {
  if (!process.env.MONGODB_URI) {
    console.error(
      "MONGODB_URI is missing. Add it to backend/.env before starting the server."
    );
    process.exit(1);
  }

  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("DB connected successfully.");

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.log("Failed to connect to DB:", error);
    process.exit(1);
  }
};

startServer();
