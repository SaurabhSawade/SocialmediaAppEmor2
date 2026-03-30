import App from "./app";
import env from "./config/env";
import logger from "./config/logger";

const app = new App();
const server = app.app;

const PORT = env.PORT;

const startServer = () => {
  server.listen(PORT, () => {
    logger.info(` Server is running on port ${PORT}`);
    logger.info(` Environment: ${env.NODE_ENV}`);
    logger.info(` API URL: http://localhost:${PORT}/api/v1`);
    logger.info(`  Health Check: http://localhost:${PORT}/health`);
  });
};

// // Graceful shutdown
// const gracefulShutdown = () => {
//   logger.info('Received shutdown signal, closing server...');
//   server.close(() => {
//     logger.info('Server closed successfully');
//     process.exit(0);
//   });

//   // Force close after 10 seconds
//   setTimeout(() => {
//     logger.error('Could not close connections in time, forcefully shutting down');
//     process.exit(1);
//   }, 10000);
// };

// process.on('SIGTERM', gracefulShutdown);
// process.on('SIGINT', gracefulShutdown);

// // Handle uncaught exceptions
// process.on('uncaughtException', (error) => {
//   logger.error('Uncaught Exception:', error);
//   gracefulShutdown();
// });

// // Handle unhandled promise rejections
// process.on('unhandledRejection', (reason, promise) => {
//   logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
//   gracefulShutdown();
// });

startServer();

export default server;
