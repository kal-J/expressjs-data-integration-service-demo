import mongoose, { type ClientSession } from "mongoose";

export const withTransaction = async <T>(
	fn: (session: ClientSession) => Promise<T>,
): Promise<T> => {
	const session = await mongoose.startSession();
	let result: T;

	try {
		await session.withTransaction(async () => {
			result = await fn(session);
		});
		// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
		return result!;
	} finally {
		await session.endSession();
	}
};

