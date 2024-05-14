import { ELASTIC_SEARCH_URL, exchangeNamesAndRoutingKeys } from "@order/config";
import { Channel, ConsumeMessage } from "amqplib";
import { createConnection } from "@order/queues/connection";
import { updateOrderReview } from "@order/services/order.service";
import { Logger } from "winston";
import { winstonLogger } from "@Akihira77/jobber-shared";

const logger: Logger = winstonLogger(`${ELASTIC_SEARCH_URL}`, "OrderServiceConsumer", "debug");

export async function consumeReviewFanoutMessage(
    channel: Channel
): Promise<void> {
    try {
        if (!channel) {
            channel = await createConnection();
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
            async (msg: ConsumeMessage | null) => {
                try {
                    const { type } = JSON.parse(msg!.content.toString());
                    if (type === "addReview") {
                        const { gigReview } = JSON.parse(msg!.content.toString());
                        await updateOrderReview(gigReview);

                        channel.ack(msg!);
                    }

                    channel.reject(msg!, false);
                } catch (error) {
                    channel.reject(msg!, false);

                    logger.error(
                        "consuming message got errors. consumeReviewFanoutMessage()",
                        error
                    );
                }
            }
        );
    } catch (error) {
        logger.error(
            "OrderService consumeReviewFanoutMessage() method error:",
            error
        );
    }
}
