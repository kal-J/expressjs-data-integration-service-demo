import swaggerAutogen from "swagger-autogen";
import fs from "node:fs";
import path from "node:path";

const swaggerAutogenInstance = swaggerAutogen({ openapi: "3.0.0" });

const rootDir = path.resolve(__dirname, "..");
const baseFilePath = path.join(rootDir, "docs", "swagger-base.json");
const outputFile = path.join(rootDir, "docs", "swagger-output.json");
const endpointsFiles = [path.join(rootDir, "api", "router.ts")];

// Load base spec (hybrid approach: manual overrides + autogen routes)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let doc: any = {};

if (fs.existsSync(baseFilePath)) {
	const baseContent = fs.readFileSync(baseFilePath, "utf-8");
	doc = JSON.parse(baseContent);
}

swaggerAutogenInstance(outputFile, endpointsFiles, doc);

