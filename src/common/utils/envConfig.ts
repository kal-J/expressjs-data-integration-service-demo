import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const envSchema = z.object({
	NODE_ENV: z.enum(["development", "production", "test"]).default("production"),

	HOST: z.string().min(1).default("localhost"),

	PORT: z.coerce.number().int().positive().default(8080),

	CORS_ORIGIN: z.string().refine((val) => val === "*" || z.string().url().safeParse(val).success, {
		message: "CORS_ORIGIN must be '*' or a valid URL"
	}).default("http://localhost:8080"),

	MONGODB_URI: z.string().url().default("mongodb://localhost:27017/ecommerce-db"),

	MONGODB_USERNAME: z.string().min(1).default("admin"),

	MONGODB_PASSWORD: z.string().min(1).default("password"),

	MONGODB_DATABASE: z.string().min(1).default("ecommerce-db"),

	MONGODB_DATABASE_TEST: z.string().min(1).default("test-db"),

	COMMON_RATE_LIMIT_MAX_REQUESTS: z.coerce.number().int().positive().default(1000),

	COMMON_RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(1000),
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
	console.error("❌ Invalid environment variables:", parsedEnv.error.format());
	throw new Error("Invalid environment variables");
}

export const env = {
	...parsedEnv.data,
	isDevelopment: parsedEnv.data.NODE_ENV === "development",
	isProduction: parsedEnv.data.NODE_ENV === "production",
	isTest: parsedEnv.data.NODE_ENV === "test",
};
