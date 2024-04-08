import { IOffer, IOrderDocument, IOrderEvents } from "@Akihira77/jobber-shared";
import { app } from "@order/app";
import { databaseConnection } from "@order/database";
import { start } from "@order/server";
import {
    deleteOrderNotifications,
    getNotificationByUserToId,
    markNotificationAsRead
} from "@order/services/notification.service";
import { createOrder, deleteOrder } from "@order/services/order.service";

const serverApp = app;
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

describe("Update method", () => {
    beforeAll(async () => {
        await databaseConnection();

        start(serverApp);

        await createOrder(data);
    });

    afterAll(async () => {
        await deleteOrder(data.gigId, data.sellerId, data.orderId);
        await deleteOrderNotifications(
            data.buyerUsername,
            data.sellerUsername,
            data.orderId
        );
        await deleteOrderNotifications(
            data.sellerUsername,
            data.sellerUsername,
            data.orderId
        );
    });

    describe("markNotificationAsRead())", () => {
        it("NotFound case", async () => {
            const notificationId = "660246d911906db940f1c749";
            await expect(
                markNotificationAsRead(notificationId)
            ).rejects.toThrow("OrderNotification is not found");
        });

        it("Success case", async () => {
            const orderNotificationFromDb = await getNotificationByUserToId(
                data.sellerUsername
            );

            const result = await markNotificationAsRead(
                orderNotificationFromDb[0]._id!
            );

            expect(result.isRead).toEqual(true);
        });
    });
});
