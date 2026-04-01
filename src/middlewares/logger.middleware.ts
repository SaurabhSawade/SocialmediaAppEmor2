import { Request, Response, NextFunction } from "express";
import logger from "../config/logger";

export const requestLogger = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const start = Date.now();

  // Log incoming request
  logger.info(`📨 ${req.method} ${req.path}`, {
    method: req.method,
    path: req.path,
    query: Object.keys(req.query).length ? req.query : undefined,
    ip: req.ip,
  });

  // Log response on finish
  res.on("finish", () => {
    const duration = Date.now() - start;
    const statusCode = res.statusCode;

    const logLevel =
      statusCode >= 500 ? "error" : statusCode >= 400 ? "warn" : "info";

    const statusIcon = 
      statusCode >= 500 ? "❌" :
      statusCode >= 400 ? "⚠️" :
      statusCode >= 300 ? "📍" : "✅";

    const logMessage = `${statusIcon} ${req.method} ${req.path} - ${statusCode} ${duration}ms`;

    logger[logLevel](logMessage, {
      method: req.method,
      path: req.path,
      status: statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
      userId: (req as any).user?.id,
    });
  });

  next();
};
