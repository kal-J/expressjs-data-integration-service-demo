import mongoose, { type Document, Schema } from "mongoose";

export interface IOrder extends Document {
	order_id: number;
	customer_id: number;
	product_name: string;
	amount: number;
	order_date: Date;
	status: "completed" | "pending" | "shipped";
}

const orderSchema = new Schema<IOrder>(
	{
		order_id: {
			type: Number,
			required: true,
			unique: true,
		},
		customer_id: {
			type: Number,
			required: true,
			index: true,
		},
		product_name: {
			type: String,
			required: true,
		},
		amount: {
			type: Number,
			required: true,
		},
		order_date: {
			type: Date,
			required: true,
		},
		status: {
			type: String,
			required: true,
			enum: ["completed", "pending", "shipped"],
		},
	},
	{
		timestamps: false,
	},
);

orderSchema.index({ customer_id: 1, order_date: -1 });
orderSchema.index({ customer_id: 1, status: 1 });

export const Order = mongoose.model<IOrder>("Order", orderSchema);
