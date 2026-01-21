import mongoose from "mongoose";
import { describe, expect, it } from "vitest";
import { Customer } from "../customerModel";
import { customerService } from "../customerService";

describe("CustomerService", () => {
	beforeAll(async () => {
		// Connect to test database
		await mongoose.connect(process.env.MONGODB_URI_TEST || "mongodb://localhost:27017/test-db");
	});

	afterAll(async () => {
		await mongoose.connection.close();
	});

	beforeEach(async () => {
		await Customer.deleteMany({});
	});

	describe("importFromCSV", () => {
		it("should successfully import valid CSV data", async () => {
			const csvBuffer = Buffer.from(
				"customer_id,name,email,country,signup_date\n" +
					"1,John Doe,john@example.com,USA,2024-01-15\n" +
					"2,Jane Smith,jane@example.com,UK,2024-02-20",
			);

			const result = await customerService.importFromCSV(csvBuffer);

			expect(result.success).toBe(true);
			expect(result.responseObject?.recordsImported).toBe(2);
			expect(result.statusCode).toBe(201);

			const customers = await Customer.find({});
			expect(customers).toHaveLength(2);
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
			await Customer.create({
				customer_id: 1,
				name: "John Doe",
				email: "john@example.com",
				country: "USA",
				signup_date: new Date("2024-01-15"),
			});

			const result = await customerService.findById(1);

			expect(result.success).toBe(true);
			expect(result.responseObject).toBeTruthy();
			expect(result.responseObject?.email).toBe("john@example.com");
		});

		it("should return null for non-existent customer", async () => {
			const result = await customerService.findById(999);

			expect(result.success).toBe(false);
			expect(result.statusCode).toBe(404);
			expect(result.responseObject).toBeNull();
		});
	});

	describe("findByCountry", () => {
		it("should find customers by country", async () => {
			await Customer.create([
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
			]);

			const result = await customerService.findByCountry("USA");

			expect(result.success).toBe(true);
			expect(result.responseObject).toHaveLength(1);
			expect(result.responseObject?.[0]?.country).toBe("USA");
		});
	});
});
