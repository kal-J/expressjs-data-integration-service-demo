import type { Request, Response } from "express";
import { orderService } from "./orderService";

export const uploadOrders = async (req: Request, res: Response): Promise<void> => {
	const file = req.file;
	if (!file) {
		res.status(400).json({
			success: false,
			recordsImported: 0,
			message: "No file uploaded",
		});
		return;
	}

	const serviceResponse = await orderService.importFromCSV(file.buffer);
	res.status(serviceResponse.statusCode).send(serviceResponse);
};
