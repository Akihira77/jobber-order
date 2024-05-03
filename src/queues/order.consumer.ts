import { winstonLogger } from "@Akihira77/jobber-shared";
import { ELASTIC_SEARCH_URL, exchangeNamesAndRoutingKeys } from "@order/config";
import { Channel, ConsumeMessage } from "amqplib";
import { Logger } from "winston";
import { createConnection } from "@order/queues/connection";
import { updateOrderReview } from "@order/services/order.service";

const log: Logger = winstonLogger(
    `${ELASTIC_SEARCH_URL}`,
    "orderServiceConsumer",
    "debug"
);

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
                const { type } = JSON.parse(message!.content.toString())

                if (type === "addReview") {
                    const { messageDetails } = JSON.parse(message!.content.toString())
                    await updateOrderReview(messageDetails);
                }

                channel.ack(message!);
            }
        );
    } catch (error) {
        log.error(
            "OrderService consumeReviewFanoutMessage() method error:",
            error
        );
    }
}
