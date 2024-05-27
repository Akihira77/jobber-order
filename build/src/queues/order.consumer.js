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
Object.defineProperty(exports, "__esModule", { value: true });
exports.consumeReviewFanoutMessage = void 0;
const config_1 = require("../config");
const connection_1 = require("../queues/connection");
const order_service_1 = require("../services/order.service");
const jobber_shared_1 = require("@Akihira77/jobber-shared");
const logger = (0, jobber_shared_1.winstonLogger)(`${config_1.ELASTIC_SEARCH_URL}`, "OrderServiceConsumer", "debug");
function consumeReviewFanoutMessage(channel) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            if (!channel) {
                channel = yield (0, connection_1.createConnection)();
            }
            const { reviewService } = config_1.exchangeNamesAndRoutingKeys;
            const queueName = "order-review-queue";
            yield channel.assertExchange(reviewService.review.exchangeName, "fanout");
            const jobberQueue = yield channel.assertQueue(queueName, {
                durable: true,
                autoDelete: false
            });
            yield channel.bindQueue(jobberQueue.queue, reviewService.review.exchangeName, "");
            yield channel.consume(jobberQueue.queue, (msg) => __awaiter(this, void 0, void 0, function* () {
                try {
                    const { type } = JSON.parse(msg.content.toString());
                    if (type === "addReview") {
                        const { gigReview } = JSON.parse(msg.content.toString());
                        yield (0, order_service_1.updateOrderReview)(gigReview);
                        channel.ack(msg);
                    }
                    channel.reject(msg, false);
                }
                catch (error) {
                    channel.reject(msg, false);
                    logger.error("consuming message got errors. consumeReviewFanoutMessage()", error);
                }
            }));
        }
        catch (error) {
            logger.error("OrderService consumeReviewFanoutMessage() method error:", error);
        }
    });
}
exports.consumeReviewFanoutMessage = consumeReviewFanoutMessage;
//# sourceMappingURL=order.consumer.js.map