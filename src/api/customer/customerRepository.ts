import { type ClientSession } from "mongoose";
import { Customer, type ICustomer } from "./customerModel";

export interface ICustomerRepository {
	findById(customerId: number): Promise<ICustomer | null>;
	findAll(): Promise<ICustomer[]>;
	findByCountry(country: string): Promise<ICustomer[]>;
	create(customerData: Partial<ICustomer>, session?: ClientSession): Promise<ICustomer>;
	createMany(customersData: Partial<ICustomer>[], session?: ClientSession): Promise<void>;
	deleteAll(session?: ClientSession): Promise<void>;
}

export class CustomerRepository implements ICustomerRepository {
	async findById(customerId: number): Promise<ICustomer | null> {
		return Customer.findOne({ customer_id: customerId });
	}

	async findAll(): Promise<ICustomer[]> {
		return Customer.find({});
	}

	async findByCountry(country: string): Promise<ICustomer[]> {
		return Customer.find({ country });
	}

	async create(customerData: Partial<ICustomer>, session?: ClientSession): Promise<ICustomer> {
		const customer = new Customer(customerData);
		if (session) {
			customer.$session(session);
		}
		return customer.save();
	}

	async createMany(customersData: Partial<ICustomer>[], session?: ClientSession): Promise<void> {
		if (session) {
			await Customer.insertMany(customersData, { session });
		} else {
		await Customer.insertMany(customersData);
		}
	}

	async deleteAll(session?: ClientSession): Promise<void> {
		if (session) {
			await Customer.deleteMany({}, { session });
		} else {
		await Customer.deleteMany({});
		}
	}
}

export const customerRepository: ICustomerRepository = new CustomerRepository();
