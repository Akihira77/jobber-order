"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrderQueue = void 0;
const config_1 = require("../config");
const orderNotification_service_1 = require("../services/orderNotification.service");
const order_service_1 = require("../services/order.service");
const amqplib_1 = __importDefault(require("amqplib"));
const typia_1 = __importDefault(require("typia"));
const server_1 = require("../server");
class OrderQueue {
    constructor(logger) {
        this.logger = logger;
    }
    createConnection() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const connection = yield amqplib_1.default.connect(`${config_1.RABBITMQ_ENDPOINT}`);
                this.logger("queues/connection.ts - createConnection()").info("OrderService connected to RabbitMQ successfully...");
                this.closeConnection(connection);
                return connection;
            }
            catch (error) {
                this.logger("queues/connection.ts - createConnection()").error("OrderService createConnection() method error:", error);
                process.exit(1);
            }
        });
    }
    publishDirectMessage(ch, exchangeName, routingKey, message, logMessage) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield ch.assertExchange(exchangeName, "direct");
                ch.publish(exchangeName, routingKey, Buffer.from(message));
                // this.logger(
                //     "queues/order.producer.ts - publishDirectMessage()"
                // ).info(logMessage)
                console.log(logMessage);
            }
            catch (error) {
                this.logger("queues/order.producer.ts - publishDirectMessage()").error("OrderService QueueProducer publishDirectMessage() method error:", error);
            }
        });
    }
    consumeReviewFanoutMessage(ch) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { reviewService } = config_1.exchangeNamesAndRoutingKeys;
                const queueName = "order-review-queue";
                yield ch.assertExchange(reviewService.review.exchangeName, "fanout");
                const jobberQueue = yield ch.assertQueue(queueName, {
                    durable: true,
                    autoDelete: false
                });
                yield ch.bindQueue(jobberQueue.queue, reviewService.review.exchangeName, "");
                yield ch.consume(jobberQueue.queue, (msg) => __awaiter(this, void 0, void 0, function* () {
                    try {
                        const { type } = (input => { const is = input => {
                            return true;
                        }; input = JSON.parse(input); return is(input) ? input : null; })(msg.content.toString());
                        if (type === "addReview") {
                            const { gigReview } = (input => { const is = input => {
                                return true;
                            }; input = JSON.parse(input); return is(input) ? input : null; })(msg.content.toString());
                            const notificationSvc = new orderNotification_service_1.OrderNotificationService(this.logger);
                            const orderSvc = new order_service_1.OrderService(server_1.pubMQOrderObject, ch, notificationSvc);
                            yield orderSvc.updateOrderReview(gigReview);
                            ch.ack(msg);
                            return;
                        }
                        ch.reject(msg, false);
                    }
                    catch (error) {
                        ch.reject(msg, false);
                        this.logger("queues/order.queue.ts - consumeReviewFanoutMessage()").error("consuming message got errors. consumeReviewFanoutMessage()", error);
                    }
                }));
            }
            catch (error) {
                this.logger("queues/order.queue.ts - consumeReviewFanoutMessage()").error("OrderService consumeReviewFanoutMessage() method error:", error);
            }
        });
    }
    closeConnection(connection) {
        process.once("SIGINT", () => __awaiter(this, void 0, void 0, function* () {
            yield connection.close();
        }));
    }
}
exports.OrderQueue = OrderQueue;
//# sourceMappingURL=order.queue.js.map