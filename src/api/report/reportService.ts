import { StatusCodes } from "http-status-codes";
import { type ICustomer } from "@/api/customer/customerModel";
import { customerRepository, type ICustomerRepository } from "@/api/customer/customerRepository";
import { orderRepository, type IOrderRepository } from "@/api/order/orderRepository";
import { ServiceResponse } from "@/common/utils/serviceResponse";
import { logger } from "@/server";
import type {
	CustomerSummaryDTO,
	CustomerSummaryResponseDTO,
	OrderSummaryDTO,
	OrderSummaryResponseDTO,
} from "./dto/reportQuery.dto";

export class ReportService {
	constructor(
		private readonly customerRepo: ICustomerRepository,
		private readonly orderRepo: IOrderRepository,
	) {}

	async getCustomerSummary(customerId: number): Promise<ServiceResponse<CustomerSummaryResponseDTO | null>> {
		try {
			const customer = await this.customerRepo.findById(customerId);
			if (!customer) {
				return ServiceResponse.failure("Customer not found", null, StatusCodes.NOT_FOUND);
			}

			const orders = await this.orderRepo.findByCustomerId(customerId);

			const customerSummary: CustomerSummaryDTO = {
				id: customer.customer_id.toString(),
				name: customer.name,
				email: customer.email,
				country: customer.country,
				signupDate: customer.signup_date.toISOString().split("T")[0],
			};

			const totalOrders = orders.length;
			const totalSpent = orders.reduce((sum, order) => sum + order.amount, 0);

			const orderSummaries: OrderSummaryDTO[] = orders.map((order) => ({
				orderId: order.order_id.toString(),
				productName: order.product_name,
				amount: order.amount,
				orderDate: order.order_date.toISOString().split("T")[0],
				status: order.status,
			}));

			const orderSummary: OrderSummaryResponseDTO = {
				totalOrders,
				totalSpent,
				orders: orderSummaries,
			};

			return ServiceResponse.success("Customer summary found", {
				customer: customerSummary,
				orderSummary,
			});
		} catch (ex) {
			const errorMessage = `Error getting customer summary for id ${customerId}: ${(ex as Error).message}`;
			logger.error(errorMessage);
			return ServiceResponse.failure(
				"An error occurred while fetching customer summary",
				null,
				StatusCodes.INTERNAL_SERVER_ERROR,
			);
		}
	}

	async getCustomerOrdersReport(filters: {
		country?: string;
		minSpent?: number;
	}): Promise<ServiceResponse<Array<{ customer: ICustomer; orderSummary: OrderSummaryResponseDTO }>>> {
		try {
			const customers = filters.country
				? await this.customerRepo.findByCountry(filters.country)
				: await this.customerRepo.findAll();

			const results: Array<{ customer: ICustomer; orderSummary: OrderSummaryResponseDTO }> = [];

			for (const customer of customers) {
				const orders = await this.orderRepo.findByCustomerId(customer.customer_id);
				const totalOrders = orders.length;
				const totalSpent = orders.reduce((sum, order) => sum + order.amount, 0);

				// Apply minSpent filter
				if (filters.minSpent && totalSpent < filters.minSpent) {
					continue;
				}

				const orderSummary: OrderSummaryResponseDTO = {
					totalOrders,
					totalSpent,
					orders: orders.map((order) => ({
						orderId: order.order_id.toString(),
						productName: order.product_name,
						amount: order.amount,
						orderDate: order.order_date.toISOString().split("T")[0],
						status: order.status,
					})),
				};

				results.push({
					customer,
					orderSummary,
				});
			}

			// Sort by totalSpent descending
			results.sort((a, b) => b.orderSummary.totalSpent - a.orderSummary.totalSpent);

			return ServiceResponse.success("Customer orders report generated", results);
		} catch (ex) {
			const errorMessage = `Error generating customer orders report: ${(ex as Error).message}`;
			logger.error(errorMessage);
			return ServiceResponse.failure(
				"An error occurred while generating report",
				[],
				StatusCodes.INTERNAL_SERVER_ERROR,
			);
		}
	}
}

export const createReportService = (
	customerRepo: ICustomerRepository = customerRepository,
	orderRepo: IOrderRepository = orderRepository,
): ReportService => new ReportService(customerRepo, orderRepo);

export const reportService = createReportService();
