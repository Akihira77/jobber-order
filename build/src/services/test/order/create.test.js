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
const jobber_shared_1 = require("@Akihira77/jobber-shared");
const config_1 = require("../../../config");
const database_1 = require("../../../database");
const order_queue_1 = require("../../../queues/order.queue");
const order_service_1 = require("../../order.service");
const orderNotification_service_1 = require("../../orderNotification.service");
const logger = (moduleName) => (0, jobber_shared_1.winstonLogger)(`${config_1.ELASTIC_SEARCH_URL}`, moduleName !== null && moduleName !== void 0 ? moduleName : "Order Service", "debug");
const offer = {
    gigTitle: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor i",
    price: 300,
    description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore ",
    deliveryInDays: 5,
    oldDeliveryDate: new Date().toString(),
    newDeliveryDate: new Date().toString(),
    accepted: true,
    cancelled: false
};
const events = {
    placeOrder: new Date().toString(),
    requirements: new Date().toString(),
    orderStarted: new Date().toString()
};
const requestNewOrder = {
    offer: offer,
    gigId: "65ea7e48d784cc0840f19069",
    sellerId: "65e9cc7c1d2eacf8631ba73b",
    sellerUsername: "Kasandra",
    sellerImage: "https://res.cloudinary.com/duthytmqy/image/upload/v1709731388/92b5de69-ae5d-4afc-a656-767e8a6cc112.jpg",
    sellerEmail: "kasandra67@ethereal.email",
    gigCoverImage: "https://res.cloudinary.com/duthytmqy/image/upload/v1709866626/h2uqxsqqxqie8ic0ccwl.jpg",
    gigMainTitle: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor i",
    gigBasicTitle: "Lorem ipsum dolor sit amet, consectetur",
    gigBasicDescription: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore ",
    buyerId: "65fb82ad94fc785bd3d0be45",
    buyerUsername: "Lucile",
    buyerEmail: "lucile.cummings@ethereal.email",
    buyerImage: "https://res.cloudinary.com/duthytmqy/image/upload/v1710981856/35548e40-0646-462c-b92f-6e457f947d58.jpg",
    status: "in progress",
    orderId: `JO${Math.floor(Math.random() * (9 * Math.pow(10, 10))) + Math.pow(10, 10)}`,
    invoiceId: `JI${Math.floor(Math.random() * (9 * Math.pow(10, 10))) + Math.pow(10, 10)}`,
    quantity: 2,
    price: 20,
    serviceFee: 2.5,
    paymentIntent: "pi_3Oy4YCLhVVbUWRAR0TwXiX3c",
    events: events
};
describe("Create method", () => {
    let db;
    let orderNotificationService;
    let orderService;
    beforeAll(() => __awaiter(void 0, void 0, void 0, function* () {
        yield (0, database_1.databaseConnection)();
        orderNotificationService = new orderNotification_service_1.OrderNotificationService(logger);
        const queue = new order_queue_1.OrderQueue(logger);
        const conn = yield queue.createConnection();
        const ch = yield conn.createChannel();
        orderService = new order_service_1.OrderService(queue, ch, orderNotificationService);
    }));
    afterAll(() => __awaiter(void 0, void 0, void 0, function* () {
        yield orderNotificationService.deleteOrderNotifications(requestNewOrder.buyerUsername, requestNewOrder.sellerUsername, requestNewOrder.orderId);
        yield orderNotificationService.deleteOrderNotifications(requestNewOrder.sellerUsername, requestNewOrder.sellerUsername, requestNewOrder.orderId);
        yield db.connection.close();
    }));
    describe("createOrder() method", () => {
        it("Should return error because parameters is required", () => __awaiter(void 0, void 0, void 0, function* () {
            yield expect(orderService.createOrder({})).rejects.toThrow('"offer" is required');
        }));
        it("Should success creating order and saved to database", () => __awaiter(void 0, void 0, void 0, function* () {
            const result = yield orderService.createOrder(requestNewOrder);
            yield orderService.deleteOrder(result.gigId, result.sellerId, result.orderId);
            expect(result).not.toBeNull();
        }));
    });
});
//# sourceMappingURL=create.test.js.map