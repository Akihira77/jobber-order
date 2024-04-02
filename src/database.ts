import { DATABASE_URL } from "@order/config";
import mongoose from "mongoose";

export const databaseConnection = async (): Promise<void> => {
    try {
        // console.log(DATABASE_URL);
        await mongoose.connect(DATABASE_URL!);
        console.log("Order service successfully connected to database.");
    } catch (error) {
        console.log("OrderService databaseConnection() method error:", error);
    }
};
