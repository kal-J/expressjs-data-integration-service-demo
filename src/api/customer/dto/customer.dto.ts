import { IsDateString, IsEmail, IsNotEmpty, IsString, validate } from "class-validator";

export class CustomerDTO {
	@IsNotEmpty({ message: "customer_id is required" })
	customer_id!: string;

	@IsNotEmpty({ message: "name is required" })
	@IsString({ message: "name must be a string" })
	name!: string;

	@IsEmail({}, { message: "Invalid email format" })
	@IsNotEmpty({ message: "email is required" })
	email!: string;

	@IsNotEmpty({ message: "country is required" })
	@IsString({ message: "country must be a string" })
	country!: string;

	@IsDateString({}, { message: "signup_date must be a valid date (YYYY-MM-DD)" })
	@IsNotEmpty({ message: "signup_date is required" })
	signup_date!: string;
}

export const validateCustomerDTO = async (data: unknown): Promise<{ valid: boolean; errors: string[] }> => {
	const dto = new CustomerDTO();
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

export class CustomerUploadResponseDTO {
	success!: boolean;
	recordsImported!: number;
	message!: string;
}
