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

    // 404 handler
    this.app.use((req, res) => {
      ApiResponseHandler.error(res, Messages.NOT_FOUND, HttpStatus.NOT_FOUND);
    });
  }

  private initializeErrorHandling(): void {
    this.app.use(ErrorMiddleware.handle);
  }
}

export default App;
