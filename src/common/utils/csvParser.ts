import { Readable } from "node:stream";
import csv from "csv-parser";

export interface CSVParseResult<T = Record<string, string>> {
	data: T[];
	errors: string[];
	rowCount: number;
}

export const parseCSV = async <T = Record<string, string>>(buffer: Buffer): Promise<CSVParseResult<T>> => {
	return new Promise((resolve, reject) => {
		const data: T[] = [];
		const errors: string[] = [];
		let rowCount = 0;

		const stream = Readable.from(buffer);
		const parser = csv();

		stream
			.pipe(parser)
			.on("data", (row: T) => {
				data.push(row);
				rowCount++;
			})
			.on("error", (error: Error) => {
				errors.push(error.message);
			})
			.on("end", () => {
				resolve({
					data,
					errors,
					rowCount,
				});
			})
			.on("error", (error: Error) => {
				reject(error);
			});
	});
};

export const validateCSVData = <T>(
	data: T[],
	validator: (row: T, index: number) => string[],
): { valid: T[]; errors: Array<{ index: number; error: string }> } => {
	const valid: T[] = [];
	const errors: Array<{ index: number; error: string }> = [];

	for (let i = 0; i < data.length; i++) {
		const row = data[i];
		const rowErrors = validator(row, i);

		if (rowErrors.length > 0) {
			for (const error of rowErrors) {
				errors.push({ index: i, error });
			}
		} else {
			valid.push(row);
		}
	}

	return { valid, errors };
};
