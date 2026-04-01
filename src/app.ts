// import express from "express";
// import cors from "cors";
// import helmet from "helmet";
// import compression from "compression";
// import env from "./config/env";
// import routes from "./routes";
// import { ErrorMiddleware } from "./middlewares/error.middleware";
// import { requestLogger } from "./middlewares/logger.middleware";
// import { rateLimiter } from "./middlewares/rate-limit.middleware";
// import { ApiResponseHandler } from "./utils/api-response";
// import { HttpStatus } from "./constants/http-status";
// import { Messages } from "./constants/messages";
// import path from "path";

// class App {
//   public app: express.Application;

//   constructor() {
//     this.app = express();
//     this.initializeMiddlewares();
//     this.initializeStaticFiles(); 
//     this.initializeRoutes();
//     this.initializeErrorHandling();
//   }

//   private initializeMiddlewares(): void {
//     // Security
//     this.app.use(helmet());
//     this.app.use(
//       cors({
//         origin: env.CORS_ORIGIN.split(","),
//         credentials: true,
//       }),
//     );

//     // Compression
//     this.app.use(compression());

//     // Logging
//     this.app.use(requestLogger);

//     // Rate limiting
//     this.app.use(rateLimiter);

//     // Body parsing
//     this.app.use(express.json({ limit: "10mb" }));
//     this.app.use(express.urlencoded({ extended: true, limit: "10mb" }));
//   }

//     private initializeStaticFiles(): void {
//     // Serve uploaded files
//     this.app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));
//   }

//   private initializeRoutes(): void {
//     // Health check
//     this.app.get("/health", (req, res) => {
//       ApiResponseHandler.success(res, "Server is healthy", {
//         environment: env.NODE_ENV,
//         timestamp: new Date().toISOString(),
//         uptime: process.uptime(),
//       });
//     });

//     // API routes
//     this.app.use("/api/v1", routes);

//     // API documentation helper
//     this.app.get("/api", (req, res) => {
//       ApiResponseHandler.success(res, "API Information", {
//         version: "1.0.0",
//         baseUrl: "/api/v1",
//         endpoints: {
//           auth: {
//             register: "POST /api/v1/auth/register",
//             login: "POST /api/v1/auth/login",
//             "forgot-password": "POST /api/v1/auth/forgot-password",
//             "reset-password": "POST /api/v1/auth/reset-password",
//             "verify-otp": "POST /api/v1/auth/verify-otp",
//             "refresh-token": "POST /api/v1/auth/refresh-token",
//             "change-password": "POST /api/v1/auth/change-password (protected)",
//             logout: "POST /api/v1/auth/logout (protected)",
//             me: "GET /api/v1/auth/me (protected)",
//             sessions: "GET /api/v1/auth/sessions (protected)",
//           },
//           users: {
//             profile: "GET /api/v1/users/profile (protected)",
//             "update-profile": "PUT /api/v1/users/profile (protected)",
//             "update-avatar": "POST /api/v1/users/avatar (protected)",
//             "remove-avatar": "DELETE /api/v1/users/avatar (protected)",
//             settings: "PUT /api/v1/users/settings (protected)",
//             "change-email": "POST /api/v1/users/change-email (protected)",
//             "change-phone": "POST /api/v1/users/change-phone (protected)",
//             account: "DELETE /api/v1/users/account (protected)",
//             "public-profile": "GET /api/v1/users/:username",
//           },
//           profile: {
//             "get-public-profile": "GET /api/v1/:username",
//             "avatar-upload": "POST /api/v1/profile/avatar (protected)",
//             "avatar-remove": "DELETE /api/v1/profile/avatar (protected)",
//           },
//           posts: {
//             "create-post": "POST /api/v1/posts (protected)",
//             "feed": "GET /api/v1/posts/feed (protected)",
//             "post-detail": "GET /api/v1/posts/:postId (protected)",
//             "update-post": "PUT /api/v1/posts/:postId (protected)",
//             "delete-post": "DELETE /api/v1/posts/:postId (protected)",
//             "archive-post": "POST /api/v1/posts/:postId/archive (protected)",
//             "like-post": "POST /api/v1/posts/:postId/like (protected)",
//           },
//           comments: {
//             "add-comment": "POST /api/v1/posts/:postId/comments (protected)",
//             "get-comments": "GET /api/v1/posts/:postId/comments (protected)",
//             "update-comment": "PUT /api/v1/comments/:commentId (protected)",
//             "delete-comment": "DELETE /api/v1/comments/:commentId (protected)",
//             "like-comment": "POST /api/v1/comments/:commentId/like (protected)",
//           },
//         },
//         timestamp: new Date().toISOString(),
//       });
//     }); 

//     // 404 handler with detailed route information
//     this.app.use((req, res) => {
//       const availableRoutes = [
//         "GET /health",
//         "GET /api",
//         "POST /api/v1/auth/register",
//         "POST /api/v1/auth/login",
//         "POST /api/v1/auth/forgot-password",
//         "POST /api/v1/auth/reset-password",
//         "POST /api/v1/auth/verify-otp",
//         "POST /api/v1/auth/refresh-token",
//         "POST /api/v1/auth/change-password",
//         "POST /api/v1/auth/logout",
//         "GET /api/v1/auth/me",
//         "GET /api/v1/auth/sessions",
//         "DELETE /api/v1/auth/sessions/:sessionId",
//         "GET /api/v1/users/profile",
//         "PUT /api/v1/users/profile",
//         "POST /api/v1/users/avatar",
//         "DELETE /api/v1/users/avatar",
//         "PUT /api/v1/users/settings",
//         "POST /api/v1/users/change-email",
//         "POST /api/v1/users/change-phone",
//         "DELETE /api/v1/users/account",
//         "GET /api/v1/users/:username",
//         "GET /api/v1/:username",
//         "POST /api/v1/profile/avatar",
//         "DELETE /api/v1/profile/avatar",
//         "POST /api/v1/posts",
//         "GET /api/v1/posts/feed",
//         "GET /api/v1/posts/:postId",
//         "PUT /api/v1/posts/:postId",
//         "DELETE /api/v1/posts/:postId",
//         "POST /api/v1/posts/:postId/archive",
//         "POST /api/v1/posts/:postId/like",
//         "POST /api/v1/posts/:postId/comments",
//         "GET /api/v1/posts/:postId/comments",
//         "PUT /api/v1/comments/:commentId",
//         "DELETE /api/v1/comments/:commentId",
//         "POST /api/v1/comments/:commentId/like",
//       ];

//       ApiResponseHandler.error(
//         res,
//         `Route not found: ${req.method} ${req.path}. Available routes: ${availableRoutes.join(", ")}`,
//         HttpStatus.NOT_FOUND
//       );
//     });
//   }

//   private initializeErrorHandling(): void {
//     this.app.use(ErrorMiddleware.handle);
//   }
// }

// export default App;



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