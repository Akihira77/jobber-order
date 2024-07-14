import { databaseConnection } from "@order/database"
import { start } from "@order/server"
import cloudinary from "cloudinary"
import { winstonLogger } from "@Akihira77/jobber-shared"
import { Logger } from "winston"
import { Hono } from "hono"

import {
    CLOUD_API_KEY,
    CLOUD_API_SECRET,
    CLOUD_NAME,
    ELASTIC_SEARCH_URL,
    NODE_ENV
} from "./config"

import os from "node:os"
import cluster from "node:cluster"
import { EventEmitter } from "events"

EventEmitter.setMaxListeners(20)

process.once("SIGINT", () => {
    process.exit(1)
})

process.once("SIGTERM", () => {
    process.exit(1)
})

const main = async () => {
    const logger = (moduleName?: string): Logger =>
        winstonLogger(
            `${ELASTIC_SEARCH_URL}`,
            moduleName ?? "Order Service",
            "debug"
        )

    try {
        cloudinary.v2.config({
            cloud_name: CLOUD_NAME,
            api_key: CLOUD_API_KEY,
            api_secret: CLOUD_API_SECRET
        })
        const db = await databaseConnection()
        const app = new Hono()
        start(app, logger)

        process.once("exit", async () => {
            await db.connection.close()
        })
    } catch (error) {
        logger("app.ts - main()").error(error)
        process.exit(1)
    }
}

if (NODE_ENV === "production") {
    let numCPUs = Math.floor(os.availableParallelism() / 2)
    numCPUs = 3

    if (cluster.isPrimary) {
        for (let i = 0; i < numCPUs; i++) {
            cluster.fork()
        }
        cluster.on("exit", (worker, code: number, signal: string) => {
            console.log(
                `worker process ${worker.process.pid} died, Restarting...`,
                code,
                signal
            )
            cluster.fork()
        })
    } else {
        main()
    }
} else {
    main()
}
