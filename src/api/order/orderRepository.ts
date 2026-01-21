import { type ClientSession } from "mongoose";
import { type IOrder, Order } from "./orderModel";

export interface IOrderRepository {
	findById(orderId: number): Promise<IOrder | null>;
	findByCustomerId(customerId: number): Promise<IOrder[]>;
	create(orderData: Partial<IOrder>, session?: ClientSession): Promise<IOrder>;
	createMany(ordersData: Partial<IOrder>[], session?: ClientSession): Promise<void>;
	deleteAll(session?: ClientSession): Promise<void>;
	aggregateByCustomer(): Promise<
		Array<{ customer_id: number; totalOrders: number; totalSpent: number }>
	>;
}

export class OrderRepository implements IOrderRepository {
	async findById(orderId: number): Promise<IOrder | null> {
		return Order.findOne({ order_id: orderId });
	}

	async findByCustomerId(customerId: number): Promise<IOrder[]> {
		return Order.find({ customer_id: customerId });
	}

	async create(orderData: Partial<IOrder>, session?: ClientSession): Promise<IOrder> {
		const order = new Order(orderData);
		if (session) {
			order.$session(session);
		}
		return order.save();
	}

	async createMany(ordersData: Partial<IOrder>[], session?: ClientSession): Promise<void> {
		if (session) {
			await Order.insertMany(ordersData, { session });
		} else {
		await Order.insertMany(ordersData);
		}
	}

	async deleteAll(session?: ClientSession): Promise<void> {
		if (session) {
			await Order.deleteMany({}, { session });
		} else {
		await Order.deleteMany({});
		}
	}

	async aggregateByCustomer(): Promise<
		Array<{ customer_id: number; totalOrders: number; totalSpent: number }>
	> {
		return Order.aggregate([
			{
				$group: {
					_id: "$customer_id",
					totalOrders: { $sum: 1 },
					totalSpent: { $sum: "$amount" },
				},
			},
			{
				$project: {
					customer_id: "$_id",
					totalOrders: 1,
					totalSpent: 1,
				},
			},
		]);
	}
}

export const orderRepository: IOrderRepository = new OrderRepository();
