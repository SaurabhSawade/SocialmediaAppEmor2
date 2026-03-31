import express from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import env from "./config/env";
import routes from "./routes";
import { ErrorMiddleware } from "./middlewares/error.middleware";
import { requestLogger } from "./middlewares/logger.middleware";
import { rateLimiter } from "./middlewares/rate-limit.middleware";
import { ApiResponseHandler } from "./utils/api-response";
import { HttpStatus } from "./constants/http-status";
import { Messages } from "./constants/messages";

class App {
  public app: express.Application;

  constructor() {
    this.app = express();
    this.initializeMiddlewares();
    this.initializeRoutes();
    this.initializeErrorHandling();
  }

  private initializeMiddlewares(): void {
    // Security
    this.app.use(helmet());
    this.app.use(
      cors({
        origin: env.CORS_ORIGIN.split(","),
        credentials: true,
      }),
    );

    // Compression
    this.app.use(compression());

    // Logging
    this.app.use(requestLogger);

    // Rate limiting
    this.app.use(rateLimiter);

    // Body parsing
    this.app.use(express.json({ limit: "10mb" }));
    this.app.use(express.urlencoded({ extended: true, limit: "10mb" }));
  }

  private initializeRoutes(): void {
    // Health check
    this.app.get("/health", (req, res) => {
      ApiResponseHandler.success(res, "Server is healthy", {
        environment: env.NODE_ENV,
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
      });
    });

    // API routes
    this.app.use("/api/v1", routes);

    // API documentation helper
    this.app.get("/api", (req, res) => {
      ApiResponseHandler.success(res, "API Information", {
        version: "1.0.0",
        baseUrl: "/api/v1",
        endpoints: {
          auth: {
            register: "POST /api/v1/auth/register",
            login: "POST /api/v1/auth/login",
            "forgot-password": "POST /api/v1/auth/forgot-password",
            "reset-password": "POST /api/v1/auth/reset-password",
            "verify-otp": "POST /api/v1/auth/verify-otp",
            "refresh-token": "POST /api/v1/auth/refresh-token",
            "change-password": "POST /api/v1/auth/change-password (protected)",
            logout: "POST /api/v1/auth/logout (protected)",
            me: "GET /api/v1/auth/me (protected)",
            sessions: "GET /api/v1/auth/sessions (protected)",
          },
          users: {
            profile: "GET /api/v1/users/profile (protected)",
            "update-profile": "PUT /api/v1/users/profile (protected)",
            "update-avatar": "POST /api/v1/users/avatar (protected)",
            "remove-avatar": "DELETE /api/v1/users/avatar (protected)",
            settings: "PUT /api/v1/users/settings (protected)",
            "change-email": "POST /api/v1/users/change-email (protected)",
            "change-phone": "POST /api/v1/users/change-phone (protected)",
            account: "DELETE /api/v1/users/account (protected)",
            "public-profile": "GET /api/v1/users/:username",
          },
          profile: {
            "get-public-profile": "GET /api/v1/:username",
          },
        },
        timestamp: new Date().toISOString(),
      });
    });

    // 404 handler with detailed route information
    this.app.use((req, res) => {
      const availableRoutes = [
        "GET /health",
        "GET /api",
        "POST /api/v1/auth/register",
        "POST /api/v1/auth/login",
        "POST /api/v1/auth/forgot-password",
        "POST /api/v1/auth/reset-password",
        "POST /api/v1/auth/verify-otp",
        "POST /api/v1/auth/refresh-token",
        "POST /api/v1/auth/change-password",
        "POST /api/v1/auth/logout",
        "GET /api/v1/auth/me",
        "GET /api/v1/auth/sessions",
        "DELETE /api/v1/auth/sessions/:sessionId",
        "GET /api/v1/users/profile",
        "PUT /api/v1/users/profile",
        "POST /api/v1/users/avatar",
        "DELETE /api/v1/users/avatar",
        "PUT /api/v1/users/settings",
        "POST /api/v1/users/change-email",
        "POST /api/v1/users/change-phone",
        "DELETE /api/v1/users/account",
        "GET /api/v1/users/:username",
        "GET /api/v1/:username",
      ];

      ApiResponseHandler.error(
        res,
        `Route not found: ${req.method} ${req.path}. Available routes: ${availableRoutes.join(", ")}`,
        HttpStatus.NOT_FOUND
      );
    });
  }

  private initializeErrorHandling(): void {
    this.app.use(ErrorMiddleware.handle);
  }
}

export default App;
