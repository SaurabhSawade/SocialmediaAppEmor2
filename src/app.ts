import express, { Application, Request, Response, NextFunction } from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import path from "path";

import env from "./config/env";
import routes from "./routes";

import { ErrorMiddleware } from "./middlewares/error.middleware";
import { requestLogger } from "./middlewares/logger.middleware";
import { rateLimiter } from "./middlewares/rate-limit.middleware";

import { ApiResponseHandler } from "./utils/api-response";
import { HttpStatus } from "./constants/http-status";

class App {
  public app: Application;

  constructor() {
    this.app = express();

    this.initializeSecurity();
    this.initializeMiddlewares();
    this.initializeStaticFiles();
    this.initializeRoutes();
    this.initializeErrorHandling();
  }

  // ---------------------------
  // SECURITY
  // ---------------------------
  private initializeSecurity(): void {
    this.app.use(helmet());

    this.app.use(
      cors({
        origin: (origin, callback) => {
          const allowedOrigins = env.CORS_ORIGIN?.split(",") || [];

          if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
          } else {
            callback(new Error("CORS not allowed"));
          }
        },
        credentials: true,
      })
    );
  }

  // ---------------------------
  // GLOBAL MIDDLEWARES
  // ---------------------------
  private initializeMiddlewares(): void {
    this.app.use(compression());

    this.app.use(rateLimiter);

    this.app.use(requestLogger);

    this.app.use(express.json({ limit: "10mb" }));
    this.app.use(express.urlencoded({ extended: true, limit: "10mb" }));
  }

  // ---------------------------
  // STATIC FILES
  // ---------------------------
  private initializeStaticFiles(): void {
    this.app.use(
      "/uploads",
      express.static(path.join(process.cwd(), "uploads"), {
        maxAge: "7d",
        etag: true,
      })
    );
  }

  // ---------------------------
  // ROUTES
  // ---------------------------
  private initializeRoutes(): void {
    // Health check
    this.app.get("/health", (req: Request, res: Response) => {
      return ApiResponseHandler.success(res, "Server is healthy", {
        environment: env.NODE_ENV,
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
      });
    });


    // API info
    this.app.get("/api", (req: Request, res: Response) => {
      return ApiResponseHandler.success(res, "API Information", {
        version: "1.0.0",
        baseUrl: "/api/v1",
      });
    });
        // API base
    this.app.use("/api/v1", routes);

    // 404 handler
    this.app.use(this.handleNotFound);
  }

  // ---------------------------
  // 404 HANDLER
  // ---------------------------
  private handleNotFound = (req: Request, res: Response): void => {
    ApiResponseHandler.error(
      res,
      `Route not found: ${req.method} ${req.originalUrl}`,
      HttpStatus.NOT_FOUND
    );
  };

  // ---------------------------
  // ERROR HANDLING
  // ---------------------------
  private initializeErrorHandling(): void {
    this.app.use(
      (err: Error, req: Request, res: Response, next: NextFunction) => {
        console.error("🔥 Error:", err.message);

        if (res.headersSent) {
          return next(err);
        }

        return ErrorMiddleware.handle(err, req, res, next);
      }
    );
  }
}

export default App;