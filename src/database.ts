import { DATABASE_URL } from "@order/config"
import mongoose, { Mongoose } from "mongoose"

export const databaseConnection = async (): Promise<Mongoose> => {
    try {
        const db = await mongoose.connect(DATABASE_URL!)
        return db
    } catch (error) {
        console.log(error)
        throw error
    }
}
