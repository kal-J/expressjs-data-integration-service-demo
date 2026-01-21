import swaggerAutogen from "swagger-autogen";
import fs from "node:fs";
import path from "node:path";

const swaggerAutogenInstance = swaggerAutogen({
	openapi: "3.0.0",
	autoHeaders: false,
	autoQuery: false,
	autoBody: false
});

const rootDir = path.resolve(__dirname, "..");
const baseFilePath = path.join(rootDir, "docs", "swagger-base.json");
const outputFile = path.join(rootDir, "docs", "swagger-output.json");

// Simply copy the base spec to output since we're defining everything manually
if (fs.existsSync(baseFilePath)) {
	const baseContent = fs.readFileSync(baseFilePath, "utf-8");
	fs.writeFileSync(outputFile, baseContent, "utf-8");
	console.log("Swagger specification copied from base file");
} else {
	console.error("Base swagger file not found");
	process.exit(1);
}

