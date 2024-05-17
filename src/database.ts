import { DATABASE_URL, logger } from "@order/config";
import mongoose from "mongoose";

export const databaseConnection = async (): Promise<void> => {
    try {
        await mongoose.connect(DATABASE_URL!);
        logger("database.ts - databaseConnection()").info(
            "OrderService MongoDB is connected."
        );
    } catch (error) {
        logger("database.ts - databaseConnection()").error(
            "OrderService databaseConnection() method error:",
            error
        );
    }
};
