import { RABBITMQ_ENDPOINT } from "@order/config";
import client, { Connection, Channel } from "amqplib";

export async function createConnection(): Promise<Channel> {
    try {
        const connection: Connection = await client.connect(
            `${RABBITMQ_ENDPOINT}`
        );
        const channel: Channel = await connection.createChannel();
        console.log("Order server connected to queue successfully...");
        closeConnection(channel, connection);

        return channel;
    } catch (error) {
        console.log("OrderService createConnection() method error:", error);
        process.exit(1)
    }
}

function closeConnection(channel: Channel, connection: Connection): void {
    process.once("SIGINT", async () => {
        await channel.close();
        await connection.close();
    });
}
