import { exchangeNamesAndRoutingKeys, RABBITMQ_ENDPOINT } from "@order/config"
import { OrderNotificationService } from "@order/services/orderNotification.service"
import { OrderService } from "@order/services/order.service"
import client, { Channel, Connection, ConsumeMessage } from "amqplib"
import { Logger } from "winston"
import typia from "typia"
import { pubMQOrderObject } from "../server"
import { Server } from "socket.io"

export class OrderQueue {
    constructor(
        private readonly socket: Server,
        private logger: (moduleName: string) => Logger
    ) {}

    async createConnection(): Promise<Connection> {
        try {
            const connection: Connection = await client.connect(
                `${RABBITMQ_ENDPOINT}`
            )

            this.logger("queues/connection.ts - createConnection()").info(
                "OrderService connected to RabbitMQ successfully..."
            )
            this.closeConnection(connection)

            return connection
        } catch (error) {
            this.logger("queues/connection.ts - createConnection()").error(
                "OrderService createConnection() method error:",
                error
            )
            process.exit(1)
        }
    }

    async publishDirectMessage(
        ch: Channel,
        exchangeName: string,
        routingKey: string,
        message: string,
        logMessage: string
    ): Promise<void> {
        try {
            ch.publish(exchangeName, routingKey, Buffer.from(message))
            // this.logger(
            //     "queues/order.producer.ts - publishDirectMessage()"
            // ).info(logMessage)
            console.log(logMessage)
        } catch (error) {
            this.logger(
                "queues/order.producer.ts - publishDirectMessage()"
            ).error(
                "OrderService QueueProducer publishDirectMessage() method error:",
                error
            )
        }
    }

    async consumeReviewFanoutMessage(ch: Channel): Promise<void> {
        try {
            const { reviewService } = exchangeNamesAndRoutingKeys
            const queueName = "order-review-queue"

            await ch.assertExchange(reviewService.review.exchangeName, "fanout")

            const jobberQueue = await ch.assertQueue(queueName, {
                durable: true,
                autoDelete: false
            })

            await ch.bindQueue(
                jobberQueue.queue,
                reviewService.review.exchangeName,
                ""
            )

            await ch.consume(
                jobberQueue.queue,
                async (msg: ConsumeMessage | null) => {
                    try {
                        const { type } = typia.json.isParse<any>(
                            msg!.content.toString()
                        )
                        if (type === "addReview") {
                            const { gigReview } = typia.json.isParse<any>(
                                msg!.content.toString()
                            )
                            const notificationSvc =
                                new OrderNotificationService(
                                    this.socket,
                                    this.logger
                                )
                            const orderSvc = new OrderService(
                                pubMQOrderObject,
                                ch,
                                notificationSvc
                            )
                            await orderSvc.updateOrderReview(gigReview)

                            ch!.ack(msg!)
                            return
                        }

                        ch!.reject(msg!, false)
                    } catch (error) {
                        ch!.reject(msg!, false)

                        this.logger(
                            "queues/order.queue.ts - consumeReviewFanoutMessage()"
                        ).error(
                            "consuming message got errors. consumeReviewFanoutMessage()",
                            error
                        )
                    }
                }
            )
        } catch (error) {
            this.logger(
                "queues/order.queue.ts - consumeReviewFanoutMessage()"
            ).error(
                "OrderService consumeReviewFanoutMessage() method error:",
                error
            )
        }
    }

    closeConnection(connection: Connection): void {
        process.once("SIGINT", async () => {
            await connection.close()
        })
    }
}
