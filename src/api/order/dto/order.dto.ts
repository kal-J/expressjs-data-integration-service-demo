import { IsDateString, IsIn, IsNotEmpty, IsNumber, IsString, validate } from "class-validator";

export class OrderDTO {
	@IsNotEmpty({ message: "order_id is required" })
	order_id!: string;

	@IsNotEmpty({ message: "customer_id is required" })
	customer_id!: string;

	@IsNotEmpty({ message: "product_name is required" })
	@IsString({ message: "product_name must be a string" })
	product_name!: string;

	@IsNotEmpty({ message: "amount is required" })
	@IsNumber({}, { message: "amount must be a number" })
	amount!: string;

	@IsDateString({}, { message: "order_date must be a valid date (YYYY-MM-DD)" })
	@IsNotEmpty({ message: "order_date is required" })
	order_date!: string;

	@IsNotEmpty({ message: "status is required" })
	@IsIn(["completed", "pending", "shipped"], { message: "status must be one of: completed, pending, shipped" })
	status!: string;
}

export const validateOrderDTO = async (data: unknown): Promise<{ valid: boolean; errors: string[] }> => {
	const dto = new OrderDTO();
	Object.assign(dto, data);
	const errors = await validate(dto);

	if (errors.length > 0) {
		return {
			valid: false,
			errors: errors.map((error) => Object.values(error.constraints || {}).join(", ")),
		};
	}

	return { valid: true, errors: [] };
};

export class OrderUploadResponseDTO {
	success!: boolean;
	recordsImported!: number;
	message!: string;
}
