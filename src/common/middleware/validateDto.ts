import type { NextFunction, Request, Response } from "express";
import { plainToInstance } from "class-transformer";
import { validate } from "class-validator";
import { StatusCodes } from "http-status-codes";
import { ServiceResponse } from "@/common/utils/serviceResponse";

type Source = "body" | "query" | "params";

export const validateDto =
	<T>(DtoClass: new () => T, source: Source = "body") =>
	async (req: Request, res: Response, next: NextFunction) => {
		const data = source === "body" ? req.body : source === "query" ? req.query : req.params;
		const instance = plainToInstance(DtoClass, data);
		const errors = await validate(instance as object);

		if (errors.length > 0) {
			const messages = errors.flatMap((e) => Object.values(e.constraints || {}));
			const message =
				messages.length === 1
					? `Invalid input: ${messages[0]}`
					: `Invalid input (${messages.length} errors): ${messages.join("; ")}`;
			const serviceResponse = ServiceResponse.failure(message, null, StatusCodes.BAD_REQUEST);
			return res.status(serviceResponse.statusCode).send(serviceResponse);
		}

		next();
	};
