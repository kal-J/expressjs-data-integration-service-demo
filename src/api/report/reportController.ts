import type { Request, Response } from "express";
import { reportService } from "./reportService";

export const getCustomerSummary = async (req: Request, res: Response): Promise<void> => {
	const id = Number(req.params.customerId);
	const serviceResponse = await reportService.getCustomerSummary(id);
	res.status(serviceResponse.statusCode).send(serviceResponse);
};

export const getCustomerOrdersReport = async (req: Request, res: Response): Promise<void> => {
	const { country, minSpent } = req.query as { country?: string; minSpent?: number };
	const filters: { country?: string; minSpent?: number } = {};
	if (country) filters.country = country;
	if (typeof minSpent === "number") filters.minSpent = minSpent;

	const serviceResponse = await reportService.getCustomerOrdersReport(filters);
	res.status(serviceResponse.statusCode).send(serviceResponse);
};
