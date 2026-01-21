import { IsNumber, IsOptional, IsString, validate } from "class-validator";
import { Type } from "class-transformer";

export class ReportQueryDTO {
	@IsOptional()
	@IsString()
	country?: string;

	@IsOptional()
	@Type(() => Number)
	@IsNumber()
	minSpent?: number;
}

export const validateReportQueryDTO = async (data: unknown): Promise<{ valid: boolean; errors: string[] }> => {
	const dto = new ReportQueryDTO();
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

export class CustomerSummaryDTO {
	id!: string;
	name!: string;
	email!: string;
	country!: string;
	signupDate!: string;
}

export class OrderSummaryDTO {
	orderId!: string;
	productName!: string;
	amount!: number;
	orderDate!: string;
	status!: string;
}

export class OrderSummaryResponseDTO {
	totalOrders!: number;
	totalSpent!: number;
	orders!: OrderSummaryDTO[];
}

export class CustomerSummaryResponseDTO {
	customer!: CustomerSummaryDTO;
	orderSummary!: OrderSummaryResponseDTO;
}
