import {
    IOffer,
    IOrderDocument,
    IOrderEvents,
    winstonLogger
} from "@Akihira77/jobber-shared";
import {
    CLOUD_NAME,
    CLOUD_API_KEY,
    CLOUD_API_SECRET,
    ELASTIC_SEARCH_URL
} from "@order/config";
import { databaseConnection } from "@order/database";
import { OrderQueue } from "@order/queues/order.queue";
import { OrderService } from "@order/services/order.service";
import { OrderNotificationService } from "@order/services/orderNotification.service";
import cloudinary from "cloudinary";
import { Logger } from "winston";

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

const data: IOrderDocument = {
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

cloudinary.v2.config({
    cloud_name: CLOUD_NAME,
    api_key: CLOUD_API_KEY,
    api_secret: CLOUD_API_SECRET
});
const logger = (moduleName?: string): Logger =>
    winstonLogger(
        `${ELASTIC_SEARCH_URL}`,
        moduleName ?? "Order Service",
        "debug"
    );

let db: any;
let orderNotificationService: OrderNotificationService;
let orderService: OrderService;
describe("Update method", () => {
    beforeAll(async () => {
        await databaseConnection(logger);
        const queue = new OrderQueue(null, logger);
        orderNotificationService = new OrderNotificationService(logger);
        orderService = new OrderService(queue, orderNotificationService);
        await orderService.createOrder(data);
    });

    afterAll(async () => {
        await db.connection.close();
        await orderService.deleteOrder(data.gigId, data.sellerId, data.orderId);
        await orderNotificationService.deleteOrderNotifications(
            data.buyerUsername,
            data.sellerUsername,
            data.orderId
        );
        await orderNotificationService.deleteOrderNotifications(
            data.sellerUsername,
            data.sellerUsername,
            data.orderId
        );
    });

    describe("markNotificationAsRead())", () => {
        it("Should throw an error because notificationId is invalid", async () => {
            const notificationId = "wrong-notification-id";
            await expect(
                orderNotificationService.markNotificationAsRead(notificationId)
            ).rejects.toThrow("Invalid notification id");
        });

        it("Should return not found message", async () => {
            const notificationId = "660246d911906db940f1c749";
            await expect(
                orderNotificationService.markNotificationAsRead(notificationId)
            ).rejects.toThrow("OrderNotification is not found");
        });

        it("Should successfully updated isRead to true in database", async () => {
            const orderNotificationFromDb =
                await orderNotificationService.getNotificationByUserToId(
                    data.sellerUsername
                );

            const result =
                await orderNotificationService.markNotificationAsRead(
                    orderNotificationFromDb[0]._id!
                );

            expect(result.isRead).toEqual(true);
        });
    });
});
