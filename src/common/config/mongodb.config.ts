import mongoose from "mongoose";
import { env } from "@/common/utils/envConfig";

const connectToMongoDB = async (): Promise<void> => {
	try {
		await mongoose.connect(env.MONGODB_URI);
		console.log("✅ Connected to MongoDB successfully");
	} catch (error) {
		console.error("❌ MongoDB connection error:", error);
		process.exit(1);
	}
};

mongoose.connection.on("connected", () => {
	console.log("✅ Mongoose connected to MongoDB");
});

mongoose.connection.on("error", (error) => {
	console.error("❌ Mongoose connection error:", error);
});

mongoose.connection.on("disconnected", () => {
	console.log("⚠️  Mongoose disconnected from MongoDB");
});

const gracefulShutdown = async (): Promise<void> => {
	try {
		await mongoose.connection.close();
		console.log("✅ MongoDB connection closed through app termination");
		process.exit(0);
	} catch (error) {
		console.error("❌ Error during MongoDB shutdown:", error);
		process.exit(1);
	}
};

process.on("SIGINT", gracefulShutdown);
process.on("SIGTERM", gracefulShutdown);

export { connectToMongoDB };
