import mongoose, { type Document, Schema } from "mongoose";

export interface ICustomer extends Document {
	customer_id: number;
	name: string;
	email: string;
	country: string;
	signup_date: Date;
}

const customerSchema = new Schema<ICustomer>(
	{
		customer_id: {
			type: Number,
			required: true,
			unique: true,
		},
		name: {
			type: String,
			required: true,
		},
		email: {
			type: String,
			required: true,
		},
		country: {
			type: String,
			required: true,
			index: true,
		},
		signup_date: {
			type: Date,
			required: true,
		},
	},
	{
		timestamps: false,
	},
);

customerSchema.index({ email: 1 });
customerSchema.index({ country: 1, signup_date: -1 });

export const Customer = mongoose.model<ICustomer>("Customer", customerSchema);
