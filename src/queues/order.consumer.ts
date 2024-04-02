import { exchangeNamesAndRoutingKeys } from "@order/config";
import { Channel, ConsumeMessage } from "amqplib";
import { createConnection } from "@order/queues/connection";
import { updateOrderReview } from "@order/services/order.service";

export async function consumeReviewFanoutMessage(
    channel: Channel
): Promise<void> {
    try {
        if (!channel) {
            channel = (await createConnection()) as Channel;
        }

        const { reviewService } = exchangeNamesAndRoutingKeys;
        const queueName = "order-review-queue";

        await channel.assertExchange(
            reviewService.review.exchangeName,
            "fanout"
        );

        const jobberQueue = await channel.assertQueue(queueName, {
            durable: true,
            autoDelete: false
        });

        await channel.bindQueue(
            jobberQueue.queue,
            reviewService.review.exchangeName,
            ""
        );

        await channel.consume(
            jobberQueue.queue,
            async (message: ConsumeMessage | null) => {
                await updateOrderReview(
                    JSON.parse(message!.content.toString())
                );

                channel.ack(message!);
            }
        );
    } catch (error) {
        console.log(
            "OrderService consumeReviewFanoutMessage() method error:",
            error
        );
    }
}
