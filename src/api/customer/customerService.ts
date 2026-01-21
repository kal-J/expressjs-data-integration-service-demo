import { StatusCodes } from "http-status-codes";
import { ServiceResponse } from "@/common/utils/serviceResponse";
import { parseCSV } from "@/common/utils/csvParser";
import { withTransaction } from "@/common/utils/withTransaction";
import { customerRepository, type ICustomerRepository } from "./customerRepository";
import type { CustomerUploadResponseDTO } from "./dto/customer.dto";

export class CustomerService {
	constructor(private readonly repository: ICustomerRepository) {}

	async importFromCSV(buffer: Buffer): Promise<ServiceResponse<CustomerUploadResponseDTO>> {
		try {
			const parseResult = await parseCSV<Record<string, string>>(buffer);

			if (parseResult.errors.length > 0) {
				return ServiceResponse.failure(
					`CSV parsing errors: ${parseResult.errors.join(", ")}`,
					{ success: false, recordsImported: 0, message: "CSV parsing failed" },
					StatusCodes.BAD_REQUEST,
				);
			}

			// Validate CSV data
			const validCustomers: Array<{
				customer_id: number;
				name: string;
				email: string;
				country: string;
				signup_date: Date;
			}> = [];
			const validationErrors: string[] = [];

			for (let i = 0; i < parseResult.data.length; i++) {
				const row = parseResult.data[i];
				const errors: string[] = [];

				// Basic validation
				if (!row.customer_id) errors.push("Missing customer_id");
				if (!row.name) errors.push("Missing name");
				if (!row.email) errors.push("Missing email");
				if (!row.country) errors.push("Missing country");
				if (!row.signup_date) errors.push("Missing signup_date");

				// Email format check
				const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
				if (row.email && !emailRegex.test(row.email)) {
					errors.push("Invalid email format");
				}

				if (errors.length > 0) {
					for (const error of errors) {
						validationErrors.push(`Row ${i}: ${error}`);
					}
					continue;
				}

				// Parse data and convert types
				validCustomers.push({
					customer_id: Number.parseInt(row.customer_id || "", 10),
					name: row.name || "",
					email: row.email || "",
					country: row.country || "",
					signup_date: new Date(row.signup_date || ""),
				});
			}

			if (validationErrors.length > 0) {
				return ServiceResponse.failure(
					`Validation errors: ${validationErrors.join(", ")}`,
					{ success: false, recordsImported: 0, message: "Validation failed" },
					StatusCodes.BAD_REQUEST,
				);
			}

			await withTransaction(async (session) => {
				await this.repository.createMany(validCustomers, session);
			});

			return ServiceResponse.success(
				`Successfully imported ${validCustomers.length} customers`,
				{
					success: true,
					recordsImported: validCustomers.length,
					message: `Successfully imported ${validCustomers.length} customers`,
				},
				StatusCodes.CREATED,
			);
		} catch (ex) {
			const errorMessage = `Error importing customers: ${(ex as Error).message}`;
			console.error(errorMessage);
			return ServiceResponse.failure(
				"An error occurred while importing customers",
				{ success: false, recordsImported: 0, message: "Import failed" },
				StatusCodes.INTERNAL_SERVER_ERROR,
			);
		}
	}

	async findById(customerId: number): Promise<ServiceResponse<unknown | null>> {
		try {
			const customer = await this.repository.findById(customerId);
			if (!customer) {
				return ServiceResponse.failure("Customer not found", null, StatusCodes.NOT_FOUND);
			}
			return ServiceResponse.success("Customer found", customer);
		} catch (ex) {
			const errorMessage = `Error finding customer with id ${customerId}: ${(ex as Error).message}`;
			console.error(errorMessage);
			return ServiceResponse.failure(
				"An error occurred while finding customer",
				null,
				StatusCodes.INTERNAL_SERVER_ERROR,
			);
		}
	}

	async findByCountry(country: string): Promise<ServiceResponse<unknown[]>> {
		try {
			const customers = await this.repository.findByCountry(country);
			return ServiceResponse.success("Customers found", customers);
		} catch (ex) {
			const errorMessage = `Error finding customers by country ${country}: ${(ex as Error).message}`;
			console.error(errorMessage);
			return ServiceResponse.failure(
				"An error occurred while finding customers",
				[],
				StatusCodes.INTERNAL_SERVER_ERROR,
			);
		}
	}
}

export const createCustomerService = (
	repository: ICustomerRepository = customerRepository,
): CustomerService => new CustomerService(repository);

export const customerService = createCustomerService();
