import { StatusCodes } from "http-status-codes";
import { ServiceResponse } from "@/common/utils/serviceResponse";
import { parseCSV } from "@/common/utils/csvParser";
import { withTransaction } from "@/common/utils/withTransaction";
import type { OrderUploadResponseDTO } from "./dto/order.dto";
import { orderRepository, type IOrderRepository } from "./orderRepository";

export class OrderService {
	constructor(private readonly repository: IOrderRepository) {}

	async importFromCSV(buffer: Buffer): Promise<ServiceResponse<OrderUploadResponseDTO>> {
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
			const validOrders: Array<{
				order_id: number;
				customer_id: number;
				product_name: string;
				amount: number;
				order_date: Date;
				status: "completed" | "pending" | "shipped";
			}> = [];
			const validationErrors: string[] = [];

			for (let i = 0; i < parseResult.data.length; i++) {
				const row = parseResult.data[i];
				const errors: string[] = [];

				// Basic validation
				if (!row.order_id) errors.push("Missing order_id");
				if (!row.customer_id) errors.push("Missing customer_id");
				if (!row.product_name) errors.push("Missing product_name");
				if (!row.amount) errors.push("Missing amount");
				if (!row.order_date) errors.push("Missing order_date");
				if (!row.status) errors.push("Missing status");

				// Status validation
				const validStatuses = ["completed", "pending", "shipped"];
				if (row.status && !validStatuses.includes(row.status)) {
					errors.push(`Invalid status. Must be one of: ${validStatuses.join(", ")}`);
				}

				// Amount validation
				if (row.amount && Number.isNaN(Number.parseFloat(row.amount))) {
					errors.push("Amount must be a valid number");
				}

				if (errors.length > 0) {
					for (const error of errors) {
						validationErrors.push(`Row ${i}: ${error}`);
					}
					continue;
				}

				// Parse data and convert types
				validOrders.push({
					order_id: Number.parseInt(row.order_id || "", 10),
					customer_id: Number.parseInt(row.customer_id || "", 10),
					product_name: row.product_name || "",
					amount: Number.parseFloat(row.amount || "0"),
					order_date: new Date(row.order_date || ""),
					status: row.status as "completed" | "pending" | "shipped",
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
				await this.repository.createMany(validOrders, session);
			});

			return ServiceResponse.success(
				`Successfully imported ${validOrders.length} orders`,
				{
					success: true,
					recordsImported: validOrders.length,
					message: `Successfully imported ${validOrders.length} orders`,
				},
				StatusCodes.CREATED,
			);
		} catch (ex) {
			const errorMessage = `Error importing orders: ${(ex as Error).message}`;
			console.error(errorMessage);
			return ServiceResponse.failure(
				"An error occurred while importing orders",
				{ success: false, recordsImported: 0, message: "Import failed" },
				StatusCodes.INTERNAL_SERVER_ERROR,
			);
		}
	}

	async findByCustomerId(customerId: number): Promise<ServiceResponse<unknown[]>> {
		try {
			const orders = await this.repository.findByCustomerId(customerId);
			return ServiceResponse.success("Orders found", orders);
		} catch (ex) {
			const errorMessage = `Error finding orders for customer ${customerId}: ${(ex as Error).message}`;
			console.error(errorMessage);
			return ServiceResponse.failure("An error occurred while finding orders", [], StatusCodes.INTERNAL_SERVER_ERROR);
		}
	}
}

export const createOrderService = (repository: IOrderRepository = orderRepository): OrderService =>
	new OrderService(repository);

export const orderService = createOrderService();
