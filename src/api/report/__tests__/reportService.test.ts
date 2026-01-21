import { beforeEach, describe, expect, it, vi } from "vitest";
import { type ICustomer } from "@/api/customer/customerModel";
import type { ICustomerRepository } from "@/api/customer/customerRepository";
import type { IOrderRepository } from "@/api/order/orderRepository";
import { ReportService } from "../reportService";

describe("ReportService", () => {
	let customerRepositoryMock: ICustomerRepository;
	let orderRepositoryMock: IOrderRepository;
	let reportService: ReportService;

	beforeEach(() => {
		customerRepositoryMock = {
			findById: vi.fn(),
			findAll: vi.fn(),
			findByCountry: vi.fn(),
			create: vi.fn(),
			createMany: vi.fn(),
			deleteAll: vi.fn(),
		};

		orderRepositoryMock = {
			findById: vi.fn(),
			findByCustomerId: vi.fn(),
			create: vi.fn(),
			createMany: vi.fn(),
			deleteAll: vi.fn(),
			aggregateByCustomer: vi.fn(),
		};

		reportService = new ReportService(customerRepositoryMock, orderRepositoryMock);
	});

	describe("getCustomerSummary", () => {
		it("should return customer summary with orders", async () => {
			const customer: Partial<ICustomer> = {
				customer_id: 1,
				name: "John Doe",
				email: "john@example.com",
				country: "USA",
				signup_date: new Date("2024-01-15"),
			} as ICustomer;

			(customerRepositoryMock.findById as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(
				customer,
			);

			(orderRepositoryMock.findByCustomerId as unknown as ReturnType<typeof vi.fn>).mockResolvedValue([
				{
					order_id: 101,
					customer_id: 1,
					product_name: "Laptop",
					amount: 999.99,
					order_date: new Date("2024-05-01"),
					status: "completed" as const,
				},
				{
					order_id: 102,
					customer_id: 1,
					product_name: "Mouse",
					amount: 29.99,
					order_date: new Date("2024-05-15"),
					status: "completed" as const,
				},
			]);

			const result = await reportService.getCustomerSummary(1);

			expect(result.success).toBe(true);
			expect(result.responseObject).toBeTruthy();
			expect(result.responseObject?.customer).toEqual({
				id: "1",
				name: "John Doe",
				email: "john@example.com",
				country: "USA",
				signupDate: "2024-01-15",
			});
			expect(result.responseObject?.orderSummary).toEqual({
				totalOrders: 2,
				totalSpent: 1029.98,
				orders: expect.arrayContaining([
					{
						orderId: "101",
						productName: "Laptop",
						amount: 999.99,
						orderDate: "2024-05-01",
						status: "completed",
					},
					{
						orderId: "102",
						productName: "Mouse",
						amount: 29.99,
						orderDate: "2024-05-15",
						status: "completed",
					},
				]),
			});
		});

		it("should return not found for non-existent customer", async () => {
			(customerRepositoryMock.findById as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(
				null,
			);

			const result = await reportService.getCustomerSummary(999);

			expect(result.success).toBe(false);
			expect(result.statusCode).toBe(404);
			expect(result.responseObject).toBeNull();
		});
	});

	describe("getCustomerOrdersReport", () => {
		it("should return report with all customers", async () => {
			const customers: ICustomer[] = [
				{
					_id: "c1",
					customer_id: 1,
					name: "John Doe",
					email: "john@example.com",
					country: "USA",
					signup_date: new Date("2024-01-15"),
				} as unknown as ICustomer,
				{
					_id: "c2",
					customer_id: 2,
					name: "Jane Smith",
					email: "jane@example.com",
					country: "UK",
					signup_date: new Date("2024-02-20"),
				} as unknown as ICustomer,
			];

			(customerRepositoryMock.findAll as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(
				customers,
			);

			(orderRepositoryMock.findByCustomerId as unknown as ReturnType<typeof vi.fn>)
				.mockResolvedValueOnce([
					{
						order_id: 101,
						customer_id: 1,
						product_name: "Laptop",
						amount: 999.99,
						order_date: new Date("2024-05-01"),
						status: "completed" as const,
					},
				])
				.mockResolvedValueOnce([
					{
						order_id: 103,
						customer_id: 2,
						product_name: "Keyboard",
						amount: 79.99,
						order_date: new Date("2024-06-01"),
						status: "pending" as const,
					},
				]);

			const result = await reportService.getCustomerOrdersReport({});

			expect(result.success).toBe(true);
			expect(result.responseObject).toHaveLength(2);
		});

		it("should filter by country", async () => {
			const customers: ICustomer[] = [
				{
					_id: "c1",
					customer_id: 1,
					name: "John Doe",
					email: "john@example.com",
					country: "USA",
					signup_date: new Date("2024-01-15"),
				} as unknown as ICustomer,
			];

			(customerRepositoryMock.findByCountry as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(
				customers,
			);

			(orderRepositoryMock.findByCustomerId as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(
				[
					{
						order_id: 101,
						customer_id: 1,
						product_name: "Laptop",
						amount: 999.99,
						order_date: new Date("2024-05-01"),
						status: "completed" as const,
					},
				],
			);

			const result = await reportService.getCustomerOrdersReport({ country: "USA" });

			expect(result.success).toBe(true);
			expect(result.responseObject).toHaveLength(1);
			expect(result.responseObject?.[0].customer.country).toBe("USA");
		});

		it("should filter by minSpent", async () => {
			const customers: ICustomer[] = [
				{
					_id: "c1",
					customer_id: 1,
					name: "John Doe",
					email: "john@example.com",
					country: "USA",
					signup_date: new Date("2024-01-15"),
				} as unknown as ICustomer,
				{
					_id: "c2",
					customer_id: 2,
					name: "Jane Smith",
					email: "jane@example.com",
					country: "UK",
					signup_date: new Date("2024-02-20"),
				} as unknown as ICustomer,
			];

			(customerRepositoryMock.findAll as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(
				customers,
			);

			(orderRepositoryMock.findByCustomerId as unknown as ReturnType<typeof vi.fn>)
				.mockResolvedValueOnce([
					{
						order_id: 101,
						customer_id: 1,
						product_name: "Laptop",
						amount: 999.99,
						order_date: new Date("2024-05-01"),
						status: "completed" as const,
					},
				])
				.mockResolvedValueOnce([
					{
						order_id: 103,
						customer_id: 2,
						product_name: "Keyboard",
						amount: 79.99,
						order_date: new Date("2024-06-01"),
						status: "pending" as const,
					},
				]);

			const result = await reportService.getCustomerOrdersReport({ minSpent: 500 });

			expect(result.success).toBe(true);
			expect(result.responseObject).toHaveLength(1);
			expect(result.responseObject?.[0].customer.customer_id).toBe(1);
		});

		it("should sort by totalSpent descending", async () => {
			const customers: ICustomer[] = [
				{
					_id: "c1",
					customer_id: 1,
					name: "John Doe",
					email: "john@example.com",
					country: "USA",
					signup_date: new Date("2024-01-15"),
				} as unknown as ICustomer,
				{
					_id: "c2",
					customer_id: 2,
					name: "Jane Smith",
					email: "jane@example.com",
					country: "UK",
					signup_date: new Date("2024-02-20"),
				} as unknown as ICustomer,
			];

			(customerRepositoryMock.findAll as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(
				customers,
			);

			(orderRepositoryMock.findByCustomerId as unknown as ReturnType<typeof vi.fn>)
				.mockResolvedValueOnce([
					{
						order_id: 101,
						customer_id: 1,
						product_name: "Laptop",
						amount: 999.99,
						order_date: new Date("2024-05-01"),
						status: "completed" as const,
					},
				])
				.mockResolvedValueOnce([
					{
						order_id: 103,
						customer_id: 2,
						product_name: "Keyboard",
						amount: 79.99,
						order_date: new Date("2024-06-01"),
						status: "pending" as const,
					},
				]);

			const result = await reportService.getCustomerOrdersReport({});

			expect(result.success).toBe(true);
			expect(result.responseObject).toHaveLength(2);
			expect(result.responseObject?.[0].orderSummary.totalSpent).toBeGreaterThan(
				result.responseObject?.[1].orderSummary.totalSpent,
			);
		});
	});
});
