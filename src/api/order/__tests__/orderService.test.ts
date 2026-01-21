import { beforeEach, describe, expect, it, vi } from "vitest";
import { OrderService } from "../orderService";
import type { IOrderRepository } from "../orderRepository";

describe("importFromCSV", () => {
	it("should successfully import valid CSV data", async () => {
		const createMany = vi.fn().mockResolvedValue(undefined);
		const orderRepositoryMock: IOrderRepository = {
			findById: vi.fn(),
			findByCustomerId: vi.fn(),
			create: vi.fn(),
			createMany,
			deleteAll: vi.fn(),
			aggregateByCustomer: vi.fn(),
		};

		const orderService = new OrderService(orderRepositoryMock);

		const csvBuffer = Buffer.from(
			"order_id,customer_id,product_name,amount,order_date,status\n" +
			"101,1,Laptop,999.99,2024-05-01,completed\n" +
			"102,1,Mouse,29.99,2024-05-15,completed",
		);

		const result = await orderService.importFromCSV(csvBuffer);

		expect(result.success).toBe(true);
		expect(result.responseObject?.recordsImported).toBe(2);
		expect(result.statusCode).toBe(201);
		expect(createMany).toHaveBeenCalledTimes(1);
		expect(createMany).toHaveBeenCalledWith(
			expect.arrayContaining([
				expect.objectContaining({ order_id: 101 }),
				expect.objectContaining({ order_id: 102 }),
			]),
		);
	});

	it("should reject CSV with invalid status", async () => {
		const orderRepositoryMock: IOrderRepository = {
			findById: vi.fn(),
			findByCustomerId: vi.fn(),
			create: vi.fn(),
			createMany: vi.fn(),
			deleteAll: vi.fn(),
			aggregateByCustomer: vi.fn(),
		};

		const orderService = new OrderService(orderRepositoryMock);

		const csvBuffer = Buffer.from(
			"order_id,customer_id,product_name,amount,order_date,status\n" +
			"101,1,Laptop,999.99,2024-05-01,invalid-status",
		);

		const result = await orderService.importFromCSV(csvBuffer);

		expect(result.success).toBe(false);
		expect(result.statusCode).toBe(400);
	});

	it("should reject CSV with missing required fields", async () => {
		const orderRepositoryMock: IOrderRepository = {
			findById: vi.fn(),
			findByCustomerId: vi.fn(),
			create: vi.fn(),
			createMany: vi.fn(),
			deleteAll: vi.fn(),
			aggregateByCustomer: vi.fn(),
		};

		const orderService = new OrderService(orderRepositoryMock);

		const csvBuffer = Buffer.from(
			"order_id,customer_id,product_name,amount,order_date,status\n" + "101,1,Laptop,,2024-05-01,completed",
		);

		const result = await orderService.importFromCSV(csvBuffer);

		expect(result.success).toBe(false);
		expect(result.statusCode).toBe(400);
	});
});

describe("findByCustomerId", () => {
	it("should find orders by customer ID", async () => {
		const findByCustomerId = vi.fn().mockResolvedValue([
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

		const orderRepositoryMock: IOrderRepository = {
			findById: vi.fn(),
			findByCustomerId,
			create: vi.fn(),
			createMany: vi.fn(),
			deleteAll: vi.fn(),
			aggregateByCustomer: vi.fn(),
		};

		const orderService = new OrderService(orderRepositoryMock);

		const result = await orderService.findByCustomerId(1);

		expect(result.success).toBe(true);
		expect(result.responseObject).toHaveLength(2);
	});

	it("should return empty array for customer with no orders", async () => {
		const findByCustomerId = vi.fn().mockResolvedValue([]);

		const orderRepositoryMock: IOrderRepository = {
			findById: vi.fn(),
			findByCustomerId,
			create: vi.fn(),
			createMany: vi.fn(),
			deleteAll: vi.fn(),
			aggregateByCustomer: vi.fn(),
		};

		const orderService = new OrderService(orderRepositoryMock);

		const result = await orderService.findByCustomerId(999);

		expect(result.success).toBe(true);
		expect(result.responseObject).toHaveLength(0);
	});
});
