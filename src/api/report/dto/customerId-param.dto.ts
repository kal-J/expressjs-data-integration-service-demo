import { IsInt, Min } from "class-validator";
import { Type } from "class-transformer";

export class CustomerIdParamDTO {
	@Type(() => Number)
	@IsInt()
	@Min(1)
	customerId!: number;
}
