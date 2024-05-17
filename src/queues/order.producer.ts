import { Channel } from "amqplib";
import { createConnection } from "@order/queues/connection";
import { logger } from "@order/config";

export async function publishDirectMessage(
    channel: Channel,
    exchangeName: string,
    routingKey: string,
    message: string,
    logMessage: string
): Promise<void> {
    try {
        if (!channel) {
            channel = (await createConnection()) as Channel;
        }

        await channel.assertExchange(exchangeName, "direct");

        channel.publish(exchangeName, routingKey, Buffer.from(message));
        logger("queues/order.producer.ts - publishDireectMessage()").info(
            logMessage
        );
    } catch (error) {
        logger("queues/order.producer.ts - publishDireectMessage()").error(
            "OrderService QueueProducer publishDirectMessage() method error:",
            error
        );
    }
}
