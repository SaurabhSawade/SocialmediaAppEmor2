import { Request, Response, NextFunction } from "express";
import logger from "../config/logger";

export const requestLogger = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const start = Date.now();

  // Log request
  logger.debug(`${req.method} ${req.url} - Request received`, {
    method: req.method,
    url: req.url,
    ip: req.ip,
    userAgent: req.get("user-agent"),
  });

  // Log response on finish
  res.on("finish", () => {
    const duration = Date.now() - start;
    const statusCode = res.statusCode;

    const logLevel =
      statusCode >= 500 ? "error" : statusCode >= 400 ? "warn" : "info";

    logger[logLevel](
      `${req.method} ${req.url} - ${statusCode} - ${duration}ms`,
      {
        method: req.method,
        url: req.url,
        status: statusCode,
        duration: `${duration}ms`,
        ip: req.ip,
        userAgent: req.get("user-agent"),
        userId: (req as any).user?.id,
      },
    );
  });

  next();
};
