import { databaseConnection } from "@order/database";
import express, { Express } from "express";
import { start } from "@order/server";
import cloudinary from "cloudinary";
import { winstonLogger } from "@Akihira77/jobber-shared";
import { Logger } from "winston";

import {
    CLOUD_API_KEY,
    CLOUD_API_SECRET,
    CLOUD_NAME,
    ELASTIC_SEARCH_URL
} from "./config";

const initialize = async () => {
    cloudinary.v2.config({
        cloud_name: CLOUD_NAME,
        api_key: CLOUD_API_KEY,
        api_secret: CLOUD_API_SECRET
    });

    const logger = (moduleName?: string): Logger =>
        winstonLogger(
            `${ELASTIC_SEARCH_URL}`,
            moduleName ?? "Order Service",
            "debug"
        );
    await databaseConnection(logger);
    const app: Express = express();
    await start(app, logger);
};

initialize();
