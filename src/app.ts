import { databaseConnection } from "@order/database";
import { cloudinaryConfig } from "@order/config";
import express, { Express } from "express";
import { start } from "@order/server";

const initialize = () => {
    cloudinaryConfig();
    databaseConnection();
    const app: Express = express();
    start(app);
}

initialize();
