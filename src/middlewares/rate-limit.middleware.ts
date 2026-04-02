import rateLimit from "express-rate-limit";
import env from "../config/env";
import { Messages } from "../constants/messages";

export const rateLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.RATE_LIMIT_MAX_REQUESTS,
  message: {
    success: false,
    message: Messages.TOO_MANY_REQUESTS,
    timestamp: new Date().toISOString(),
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
});

export const authRateLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute // do it in env
  max: 50, // 5 attempts // do this in env
  skipSuccessfulRequests: true,
  message: {
    success: false,
    message:
      "Too many authentication attempts. Please try again after 15 minutes.",//put message in constants
    timestamp: new Date().toISOString(),
  },
  standardHeaders: true,
  legacyHeaders: false,
});
// same as above
export const apiRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 60, // 60 requests per minute
  message: {
    success: false,
    message: "Too many requests. Please slow down.",
    timestamp: new Date().toISOString(),
  },
  standardHeaders: true,
  legacyHeaders: false,
});
