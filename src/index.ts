import { apiRouter } from "@/api/router";
import { connectToMongoDB } from "@/common/config/mongodb.config";
import { env } from "@/common/utils/envConfig";
import { app, logger } from "@/server";
import swaggerUi from "swagger-ui-express";
import swaggerDocument from "@/docs/swagger-output.json";

// Initialize MongoDB
connectToMongoDB();

// Swagger UI
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Register API router
app.use("/api", apiRouter);

app.use((req, _res, next) => {
	const { method, url } = req;
	logger.info(`${method} ${url}`);
	next();
});

const server = app.listen(env.PORT, () => {
	const { NODE_ENV, HOST, PORT } = env;
	logger.info(`Server (${NODE_ENV}) running on port http://${HOST}:${PORT}`);
});

const onCloseSignal = () => {
	logger.info("sigint received, shutting down");
	server.close(() => {
		logger.info("server closed");
		process.exit();
	});
	setTimeout(() => process.exit(1), 10000).unref(); // Force shutdown after 10s
};

process.on("SIGINT", onCloseSignal);
process.on("SIGTERM", onCloseSignal);
