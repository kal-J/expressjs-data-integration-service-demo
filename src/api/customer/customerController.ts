import type { Request, Response } from "express";
import { customerService } from "./customerService";

export const uploadCustomers = async (req: Request, res: Response): Promise<void> => {
	const file = req.file;
	if (!file) {
		res.status(400).json({
			success: false,
			recordsImported: 0,
			message: "No file uploaded",
		});
		return;
	}

	const serviceResponse = await customerService.importFromCSV(file.buffer);
	res.status(serviceResponse.statusCode).send(serviceResponse);
};
