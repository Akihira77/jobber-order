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
exports.publishDirectMessage = void 0;
const connection_1 = require("../queues/connection");
const config_1 = require("../config");
function publishDirectMessage(channel, exchangeName, routingKey, message, logMessage) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            if (!channel) {
                channel = (yield (0, connection_1.createConnection)());
            }
            yield channel.assertExchange(exchangeName, "direct");
            channel.publish(exchangeName, routingKey, Buffer.from(message));
            (0, config_1.logger)("queues/order.producer.ts - publishDireectMessage()").info(logMessage);
        }
        catch (error) {
            (0, config_1.logger)("queues/order.producer.ts - publishDireectMessage()").error("OrderService QueueProducer publishDirectMessage() method error:", error);
        }
    });
}
exports.publishDirectMessage = publishDirectMessage;
//# sourceMappingURL=order.producer.js.map