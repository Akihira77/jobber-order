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
    ELASTIC_SEARCH_URL
} from "./config"

import path from "node:path"
import fs from "node:fs"
import os from "node:os"

const logFilePath = path.join(process.cwd(), "/usage.txt")

function getCPUUsage() {
    const cpuUsage = process.cpuUsage()
    const userCPUTime = (cpuUsage.user / 1000).toFixed(2) // dalam milidetik
    const systemCPUTime = (cpuUsage.system / 1000).toFixed(2) // dalam milidetik

    return {
        user: userCPUTime,
        system: systemCPUTime
    }
}

function getMemoryUsage() {
    const totalMemory = os.totalmem()
    const freeMemory = os.freemem()
    const usedMemory = totalMemory - freeMemory

    return {
        total: (totalMemory / (1024 * 1024)).toFixed(2), // in MB
        used: (usedMemory / (1024 * 1024)).toFixed(2), // in MB
        free: (freeMemory / (1024 * 1024)).toFixed(2) // in MB
    }
}

// Fungsi untuk mencatat penggunaan CPU dan memori ke file log
function logUsage() {
    const cpuUsage = getCPUUsage()
    const memoryUsage = getMemoryUsage()
    const timestamp = new Date().toISOString()

    const logMessage = `${timestamp} - CPU Usage: User: ${cpuUsage.user}ms Sys: ${cpuUsage.system}ms | Memory Total: ${memoryUsage.total}MB Used: ${memoryUsage.used}MB Free: ${memoryUsage.free}MB\n`

    // Tambahkan pesan log ke file log
    fs.appendFile(logFilePath, logMessage, (err: unknown) => {
        if (err) {
            console.log(err)
        }
    })
}

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
        await start(app, logger)

        process.once("exit", async () => {
            await db.connection.close()
        })
    } catch (error) {
        logger("app.ts - main()").error(error)
        process.exit(1)
    }
}

main()
setInterval(logUsage, 60 * 1000)
