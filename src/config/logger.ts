// export default logger;
import winston from "winston";
import env from "./env";

const { combine, timestamp, errors, json, colorize, printf } = winston.format;

// Custom format for console (DEV only)
const devFormat = printf(({ level, message, timestamp, ...meta }) => {
  const metaStr = Object.keys(meta).length
    ? ` ${JSON.stringify(meta, null, 2)}`
    : "";

  return `${timestamp} [${level}]: ${message}${metaStr}`;
});

const logger = winston.createLogger({
  level: env.NODE_ENV === "production" ? "info" : "debug",
  format: combine(
    timestamp(),
    errors({ stack: true }), // ensures stack traces are logged
    json() // structured logs (best for production)
  ),
  defaultMeta: { service: "SocialMediaApp" },
  transports: [
    new winston.transports.File({
      filename: "logs/error.log",
      level: "error",
    }),
    new winston.transports.File({
      filename: "logs/combined.log",
    }),
  ],
});

// Console logging for development
if (env.NODE_ENV !== "production") {
  logger.add(
    new winston.transports.Console({
      level: "debug",
      format: combine(
        colorize(),
        timestamp(),
        devFormat
      ),
    })
  );
}

export default logger;