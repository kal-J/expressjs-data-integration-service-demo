import multer, { type FileFilterCallback } from "multer";
import type { RequestHandler } from "express";

const CSV_MIME_TYPE = "text/csv";
const CSV_EXTENSION = ".csv";

const fileFilter = (req: Express.Request, file: Express.Multer.File, callback: FileFilterCallback): void => {
	const fileExtension = file.originalname.toLowerCase().endsWith(CSV_EXTENSION);

	if (fileExtension) {
		callback(null, true);
	} else {
		callback(new Error("Only CSV files are allowed"));
	}
};

const upload = multer({
	storage: multer.memoryStorage(),
	fileFilter,
	limits: {
		fileSize: 10 * 1024 * 1024, // 10MB
		// eslint-disable-next-line @typescript-eslint/no-magic-numbers
	},
});

const uploadSingleCSV: RequestHandler = upload.single("file");

export { uploadSingleCSV };
