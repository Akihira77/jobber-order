import {
    IOffer,
    IOrderDocument,
    IOrderEvents,
    winstonLogger
} from "@Akihira77/jobber-shared";
import { ELASTIC_SEARCH_URL } from "@order/config";
import { databaseConnection } from "@order/database";
import { OrderQueue } from "@order/queues/order.queue";
import { OrderService } from "@order/services/order.service";
import { OrderNotificationService } from "@order/services/orderNotification.service";
import { Logger } from "winston";

const logger = (moduleName?: string): Logger =>
    winstonLogger(
        `${ELASTIC_SEARCH_URL}`,
        moduleName ?? "Order Service",
        "debug"
    );

const offer: IOffer = {
    gigTitle:
        "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor i",
    price: 300,
    description:
        "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore ",
    deliveryInDays: 5,
    oldDeliveryDate: new Date().toString(),
    newDeliveryDate: new Date().toString(),
    accepted: true,
    cancelled: false
};

const events: IOrderEvents = {
    placeOrder: new Date().toString(),
    requirements: new Date().toString(),
    orderStarted: new Date().toString()
};

const requestNewOrder: IOrderDocument = {
    offer: offer,
    gigId: "65ea7e48d784cc0840f19069",
    sellerId: "65e9cc7c1d2eacf8631ba73b",
    sellerUsername: "Kasandra",
    sellerImage:
        "https://res.cloudinary.com/duthytmqy/image/upload/v1709731388/92b5de69-ae5d-4afc-a656-767e8a6cc112.jpg",
    sellerEmail: "kasandra67@ethereal.email",
    gigCoverImage:
        "https://res.cloudinary.com/duthytmqy/image/upload/v1709866626/h2uqxsqqxqie8ic0ccwl.jpg",
    gigMainTitle:
        "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor i",
    gigBasicTitle: "Lorem ipsum dolor sit amet, consectetur",
    gigBasicDescription:
        "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore ",
    buyerId: "65fb82ad94fc785bd3d0be45",
    buyerUsername: "Lucile",
    buyerEmail: "lucile.cummings@ethereal.email",
    buyerImage:
        "https://res.cloudinary.com/duthytmqy/image/upload/v1710981856/35548e40-0646-462c-b92f-6e457f947d58.jpg",
    status: "in progress",
    orderId: `JO${
        Math.floor(Math.random() * (9 * Math.pow(10, 10))) + Math.pow(10, 10)
    }`,
    invoiceId: `JI${
        Math.floor(Math.random() * (9 * Math.pow(10, 10))) + Math.pow(10, 10)
    }`,
    quantity: 2,
    price: 20,
    serviceFee: 2.5,
    paymentIntent: "pi_3Oy4YCLhVVbUWRAR0TwXiX3c",
    events: events
};

describe("Create method", () => {
    let db: any;
    let orderNotificationService: OrderNotificationService;
    let orderService: OrderService;
    beforeAll(async () => {
        await databaseConnection(logger);
        orderNotificationService = new OrderNotificationService(logger);
        const queue = new OrderQueue(null, logger);
        orderService = new OrderService(queue, orderNotificationService);
    });

    afterAll(async () => {
        await orderNotificationService.deleteOrderNotifications(
            requestNewOrder.buyerUsername,
            requestNewOrder.sellerUsername,
            requestNewOrder.orderId
        );
        await orderNotificationService.deleteOrderNotifications(
            requestNewOrder.sellerUsername,
            requestNewOrder.sellerUsername,
            requestNewOrder.orderId
        );

        await db.connection.close();
    });

    describe("createOrder() method", () => {
        it("Should return error because parameters is required", async () => {
            await expect(
                orderService.createOrder({} as IOrderDocument)
            ).rejects.toThrow('"offer" is required');
        });

        it("Should success creating order and saved to database", async () => {
            const result = await orderService.createOrder(requestNewOrder);
            await orderService.deleteOrder(
                result.gigId,
                result.sellerId,
                result.orderId
            );
            expect(result).not.toBeNull();
        });
    });
});
