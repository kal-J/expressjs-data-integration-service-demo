import { IsBoolean, IsNumber, IsString, ValidateIf } from "class-validator";
import { StatusCodes } from "http-status-codes";

export class ServiceResponse<T = null> {
	@IsBoolean()
	readonly success: boolean;

	@IsString()
	readonly message: string;

	@ValidateIf((o) => o.responseObject !== null && o.responseObject !== undefined)
	readonly responseObject: T;

	@IsNumber()
	readonly statusCode: number;

	private constructor(success: boolean, message: string, responseObject: T, statusCode: number) {
		this.success = success;
		this.message = message;
		this.responseObject = responseObject;
		this.statusCode = statusCode;
	}

	static success<T>(message: string, responseObject: T, statusCode: number = StatusCodes.OK) {
		return new ServiceResponse(true, message, responseObject, statusCode);
	}

	static failure<T>(message: string, responseObject: T, statusCode: number = StatusCodes.BAD_REQUEST) {
		return new ServiceResponse(false, message, responseObject, statusCode);
	}
}
