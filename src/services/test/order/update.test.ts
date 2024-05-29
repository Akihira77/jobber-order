import {
    IOffer,
    IOrderDocument,
    IDeliveredWork,
    IExtendedDelivery,
    IReviewMessageDetails,
    IOrderEvents,
    winstonLogger
} from "@Akihira77/jobber-shared";
import { ELASTIC_SEARCH_URL } from "@order/config";
import { databaseConnection } from "@order/database";
import { OrderQueue } from "@order/queues/order.queue";
import { OrderService } from "@order/services/order.service";
import { OrderNotificationService } from "@order/services/orderNotification.service";
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

const logger = (moduleName?: string): Logger =>
    winstonLogger(
        `${ELASTIC_SEARCH_URL}`,
        moduleName ?? "Order Service",
        "debug"
    );

describe("Update method", () => {
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

        await db.connection.close();
    });

    describe("cancelOrder()", () => {
        it("NotFound case", async () => {
            await expect(
                orderService.cancelOrder("wrong-order-id", {
                    buyerId: data.buyerId,
                    sellerId: data.sellerId,
                    purchasedGigs: data.gigId
                })
            ).rejects.toThrow("Order is not found");
        });

        it("Success case", async () => {
            const result = await orderService.cancelOrder(data.orderId, {
                buyerId: data.buyerId,
                sellerId: data.sellerId,
                purchasedGigs: data.gigId
            });

            expect(result.cancelled).toEqual(true);
            expect(result.status).toEqual("Cancelled");
        });
    });

    describe("approveOrder()", () => {
        it("NotFound case", async () => {
            await expect(
                orderService.approveOrder("wrong-order-id", {
                    buyerId: data.buyerId,
                    sellerId: data.sellerId,
                    purchasedGigs: data.gigId
                })
            ).rejects.toThrow("Order is not found");
        });

        it("Success case", async () => {
            const result = await orderService.approveOrder(data.orderId, {
                buyerId: data.buyerId,
                sellerId: data.sellerId,
                purchasedGigs: data.gigId
            });

            expect(result.approved).toEqual(true);
            expect(result.status).toEqual("Completed");
        });
    });

    describe("deliverOrder()", () => {
        const deliveredWork: IDeliveredWork = {
            file: "ini-file",
            fileName: "ini_file",
            fileSize: 100,
            fileType: "zip",
            message: "Hi. Check this out"
        };

        it("NotFound case", async () => {
            await expect(
                orderService.deliverOrder("wrong-order-id", true, deliveredWork)
            ).rejects.toThrow("Order is not found");
        });

        it("Success case", async () => {
            const delivered = true;
            const result = await orderService.deliverOrder(
                data.orderId,
                delivered,
                deliveredWork
            );

            expect(result.delivered).toEqual(delivered);
            expect(result.status).toEqual("Delivered");
        });
    });

    describe("requestDeliveryExtension()", () => {
        const now = new Date();
        const updatedNow = new Date(now.getDate() + 7);
        const deliveryExtension: IExtendedDelivery = {
            days: 7,
            newDate: updatedNow.toString(),
            originalDate: now.toString(),
            reason: "Give me more time"
        };

        it("NotFound case", async () => {
            await expect(
                orderService.requestDeliveryExtension(
                    "wrong-order-id",
                    deliveryExtension
                )
            ).rejects.toThrow("Order is not found");
        });

        it("Success case", async () => {
            const result = await orderService.requestDeliveryExtension(
                data.orderId,
                deliveryExtension
            );

            expect(result.requestExtension?.days).toEqual(
                deliveryExtension.days
            );
            expect(result.requestExtension?.reason).toEqual(
                deliveryExtension.reason
            );
            expect(result.requestExtension?.newDate).toEqual(
                deliveryExtension.newDate
            );
        });
    });

    describe("approveExtensionDeliveryDate()", () => {
        const now = new Date();
        const updatedNow = new Date(now.getDate() + 7);
        const deliveryExtension: IExtendedDelivery = {
            days: 7,
            newDate: updatedNow.toString(),
            originalDate: now.toString(),
            reason: "Give me more time",
            deliveryDateUpdate: updatedNow.toString()
        };

        it("NotFound case", async () => {
            await expect(
                orderService.approveExtensionDeliveryDate(
                    "wrong-order-id",
                    deliveryExtension
                )
            ).rejects.toThrow("Order is not found");
        });

        it("Success case", async () => {
            const result = await orderService.approveExtensionDeliveryDate(
                data.orderId,
                deliveryExtension
            );

            expect(result.offer.deliveryInDays).toEqual(deliveryExtension.days);
            expect(result.offer?.reason).toEqual(deliveryExtension.reason);
            expect(result.offer?.newDeliveryDate.toString()).toEqual(
                deliveryExtension.newDate
            );
            expect(result.events.deliveryDateUpdate?.toString()).toEqual(
                deliveryExtension.deliveryDateUpdate
            );
        });
    });

    describe("rejectExtensionDeliveryDate()", () => {
        it("NotFound case", async () => {
            await expect(
                orderService.rejectExtensionDeliveryDate("wrong-order-id")
            ).rejects.toThrow("Order is not found");
        });

        it("Success case", async () => {
            const result = await orderService.rejectExtensionDeliveryDate(
                data.orderId
            );

            expect(result.requestExtension).toEqual({
                originalDate: "",
                newDate: "",
                days: 0,
                reason: ""
            });
        });
    });

    describe("updateOrderReview()", () => {
        it("Forbidden accessing case", async () => {
            const orderReview: IReviewMessageDetails = {
                type: "wrong-review"
            };

            await expect(
                orderService.updateOrderReview(orderReview)
            ).rejects.toThrow(
                "You're neither buyer or seller. Can't access this resource."
            );
        });

        it("NotFound case", async () => {
            const orderReview: IReviewMessageDetails = {
                type: "buyer-review",
                orderId: "wrong-id"
            };

            await expect(
                orderService.updateOrderReview(orderReview)
            ).rejects.toThrow("Order is not found");
        });

        it("Buyer success case", async () => {
            const orderReview: IReviewMessageDetails = {
                type: "buyer-review",
                orderId: data.orderId,
                rating: 5,
                review: "Very nice. I Like it, Thanks"
            };
            const result = await orderService.updateOrderReview(orderReview);

            expect(result.buyerReview?.rating).toEqual(orderReview.rating);
            expect(result.buyerReview?.review).toEqual(orderReview.review);
        });
    });
});
