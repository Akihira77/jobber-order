import { winstonLogger } from "@Akihira77/jobber-shared";
import { Logger } from "winston";
import { DATABASE_URL, ELASTIC_SEARCH_URL } from "@order/config";
import mongoose from "mongoose";

const log: Logger = winstonLogger(
    `${ELASTIC_SEARCH_URL}`,
    "orderDatabaseServer",
    "debug"
);

export const databaseConnection = async (): Promise<void> => {
    try {
        // console.log(DATABASE_URL);
        await mongoose.connect(`${DATABASE_URL}`);
        log.info("Order service successfully connected to database.");
    } catch (error) {
        log.error("OrderService databaseConnection() method error:", error);
    }
};
