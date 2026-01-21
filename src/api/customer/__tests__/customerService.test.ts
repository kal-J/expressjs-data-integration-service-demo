import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { CustomerService, createCustomerService } from "../customerService";
import type { ICustomerRepository } from "../customerRepository";

// Mock the withTransaction utility
vi.mock("@/common/utils/withTransaction", () => ({
	withTransaction: vi.fn((fn) => fn({} as any)),
}));

// Mock repository
const mockRepository = {
	findById: vi.fn<ICustomerRepository['findById']>(),
	findAll: vi.fn<ICustomerRepository['findAll']>(),
	findByCountry: vi.fn<ICustomerRepository['findByCountry']>(),
	create: vi.fn<ICustomerRepository['create']>(),
	createMany: vi.fn<ICustomerRepository['createMany']>(),
	deleteAll: vi.fn<ICustomerRepository['deleteAll']>(),
};

const customerService = createCustomerService(mockRepository);

describe("CustomerService", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	afterEach(() => {
		vi.resetAllMocks();
	});

	describe("importFromCSV", () => {
		it("should successfully import valid CSV data", async () => {
			const csvBuffer = Buffer.from(
				"customer_id,name,email,country,signup_date\n" +
				"1,John Doe,john@example.com,USA,2024-01-15\n" +
				"2,Jane Smith,jane@example.com,UK,2024-02-20",
			);

			mockRepository.createMany.mockResolvedValue(undefined);

			const result = await customerService.importFromCSV(csvBuffer);

			expect(result.success).toBe(true);
			expect(result.responseObject?.recordsImported).toBe(2);
			expect(result.statusCode).toBe(201);
			expect(mockRepository.createMany).toHaveBeenCalledWith(
				[
					{
						customer_id: 1,
						name: "John Doe",
						email: "john@example.com",
						country: "USA",
						signup_date: new Date("2024-01-15"),
					},
					{
						customer_id: 2,
						name: "Jane Smith",
						email: "jane@example.com",
						country: "UK",
						signup_date: new Date("2024-02-20"),
					},
				],
				expect.any(Object), // session
			);
		});

		it("should reject CSV with invalid email format", async () => {
			const csvBuffer = Buffer.from(
				"customer_id,name,email,country,signup_date\n" + "1,John Doe,invalid-email,USA,2024-01-15",
			);

			const result = await customerService.importFromCSV(csvBuffer);

			expect(result.success).toBe(false);
			expect(result.statusCode).toBe(400);
		});

		it("should reject CSV with missing required fields", async () => {
			const csvBuffer = Buffer.from("customer_id,name,email,country,signup_date\n" + "1,John Doe,,USA,2024-01-15");

			const result = await customerService.importFromCSV(csvBuffer);

			expect(result.success).toBe(false);
			expect(result.statusCode).toBe(400);
		});
	});

	describe("findById", () => {
		it("should find customer by ID", async () => {
			const mockCustomer = {
				customer_id: 1,
				name: "John Doe",
				email: "john@example.com",
				country: "USA",
				signup_date: new Date("2024-01-15"),
			};

			mockRepository.findById.mockResolvedValue(mockCustomer as any);

			const result = await customerService.findById(1);

			expect(result.success).toBe(true);
			expect(result.responseObject).toBeTruthy();
			expect(result.responseObject?.email).toBe("john@example.com");
			expect(mockRepository.findById).toHaveBeenCalledWith(1);
		});

		it("should return null for non-existent customer", async () => {
			mockRepository.findById.mockResolvedValue(null);

			const result = await customerService.findById(999);

			expect(result.success).toBe(false);
			expect(result.statusCode).toBe(404);
			expect(result.responseObject).toBeNull();
			expect(mockRepository.findById).toHaveBeenCalledWith(999);
		});
	});

	describe("findByCountry", () => {
		it("should find customers by country", async () => {
			const mockCustomers = [
				{
					customer_id: 1,
					name: "John Doe",
					email: "john@example.com",
					country: "USA",
					signup_date: new Date("2024-01-15"),
				},
			];

			mockRepository.findByCountry.mockResolvedValue(mockCustomers as any);

			const result = await customerService.findByCountry("USA");

			expect(result.success).toBe(true);
			expect(result.responseObject).toHaveLength(1);
			expect(result.responseObject?.[0]?.country).toBe("USA");
			expect(mockRepository.findByCountry).toHaveBeenCalledWith("USA");
		});
	});
});
