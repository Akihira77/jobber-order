import crypto from "crypto";

import {
    BadRequestError,
    IOrderDocument,
    uploads,
    IDeliveredWork,
    IAuthPayload,
    IOrderNotifcation
} from "@Akihira77/jobber-shared";
import { STRIPE_API_PRIVATE_KEY } from "@order/config";
import { orderSchema, orderUpdateSchema } from "@order/schemas/order.schema";
import Stripe from "stripe";
import { OrderService } from "@order/services/order.service";
import { OrderNotificationService } from "@order/services/orderNotification.service";

export class OrderHandler {
    private stripe: Stripe;
    constructor(
        private orderService: OrderService,
        private orderNotificationService: OrderNotificationService
    ) {
        this.stripe = new Stripe(STRIPE_API_PRIVATE_KEY!, {
            typescript: true
        });
    }

    async findNotificationsByUserTo(
        userToName: string
    ): Promise<IOrderNotifcation[]> {
        const orderNotifs =
            await this.orderNotificationService.getNotificationByUserToId(
                userToName
            );

        return orderNotifs;
    }

    async updateNotificationReadStatus(
        notificationId: string
    ): Promise<IOrderNotifcation> {
        const orderNotif =
            await this.orderNotificationService.markNotificationAsRead(
                notificationId
            );

        return orderNotif;
    }

    async createOrderIntent(
        currUser: IAuthPayload,
        reqBody: any
    ): Promise<Stripe.Response<Stripe.PaymentIntent>> {
        const customer: Stripe.Response<
            Stripe.ApiSearchResult<Stripe.Customer>
        > = await this.stripe.customers.search({
            query: `email:"${currUser.email}"`
        });
        let customerId: string = customer.data[0]?.id;

        if (customer.data.length === 0) {
            const createdCustomer: Stripe.Response<Stripe.Customer> =
                await this.stripe.customers.create({
                    email: currUser.email,
                    metadata: {
                        buyerId: reqBody.buyerId
                    }
                });
            customerId = createdCustomer.id;
        }

        let paymentIntent: Stripe.Response<Stripe.PaymentIntent>;

        if (customerId) {
            // the service charge is 5.5% of the purchased amount
            // for purchases under 50$, an additional $2 is applied
            const serviceFee: number =
                reqBody.price < 50
                    ? (5.5 / 100) * reqBody.price + 2
                    : (5.5 / 100) * reqBody.price;
            paymentIntent = await this.stripe.paymentIntents.create({
                amount: Math.floor((reqBody.price + serviceFee) * 100),
                currency: "usd",
                customer: customerId,
                automatic_payment_methods: {
                    enabled: true
                }
            });

            return paymentIntent;
        }

        throw new BadRequestError(
            "creating payment intent failed. Please try again.",
            "handler/order.handler.ts - createOrderIntent()"
        );
    }

    async createOrder(reqBody: any): Promise<IOrderDocument> {
        const { error, value } = orderSchema.validate(reqBody);

        if (error?.details) {
            throw new BadRequestError(
                error.details[0].message,
                "Create order() method"
            );
        }

        const generateRandomNumber = (length: number): number => {
            return (
                Math.floor(Math.random() * (9 * Math.pow(10, length - 1))) +
                Math.pow(10, length - 1)
            );
        };

        // the service charge is 5.5% of the purchased amount
        // for purchases under 50$, an additional $2 is applied
        const serviceFee: number =
            value.price < 50
                ? (5.5 / 100) * value.price + 2
                : (5.5 / 100) * value.price;
        const orderData: IOrderDocument = {
            ...value,
            orderId: `JO${generateRandomNumber(11)}`,
            invoiceId: `JI${generateRandomNumber(11)}`,
            serviceFee: serviceFee
        };
        const order: IOrderDocument =
            await this.orderService.createOrder(orderData);

        return order;
    }

    async getOrderbyOrderId(orderId: string): Promise<IOrderDocument> {
        const order = await this.orderService.getOrderByOrderId(orderId);

        return order;
    }

    async getOrdersbySellerId(sellerId: string): Promise<IOrderDocument[]> {
        const orders = await this.orderService.getOrdersBySellerId(sellerId);

        return orders;
    }

    async getOrdersbyBuyerId(buyerId: string): Promise<IOrderDocument[]> {
        const orders = await this.orderService.getOrdersByBuyerId(buyerId);

        return orders;
    }

    async cancelOrder(orderId: string, reqBody: any): Promise<Boolean> {
        await this.stripe.refunds.create({
            payment_intent: `${reqBody.paymentIntentId}`
        });

        const order = await this.orderService.cancelOrder(
            orderId,
            reqBody.orderData
        );

        return order !== null;
    }

    async sellerRequestExtension(
        orderId: string,
        reqBody: any
    ): Promise<IOrderDocument> {
        const { error, value } = orderUpdateSchema.validate(reqBody);

        if (error?.details) {
            throw new BadRequestError(
                error.details[0].message,
                "Update reqeustExtension() method"
            );
        }

        const order: IOrderDocument =
            await this.orderService.requestDeliveryExtension(orderId, value);

        return order;
    }

    async updateDeliveryDate(
        orderId: string,
        type: string,
        reqBody: any
    ): Promise<IOrderDocument> {
        const { error, value } = orderUpdateSchema.validate(reqBody);

        if (error?.details) {
            throw new BadRequestError(
                error.details[0].message,
                "Update deliveryDate() method"
            );
        }

        const order: IOrderDocument =
            type === "approve"
                ? await this.orderService.approveExtensionDeliveryDate(
                      orderId,
                      value
                  )
                : await this.orderService.rejectExtensionDeliveryDate(orderId);

        return order;
    }

    async buyerApproveOrder(
        orderId: string,
        reqBody: any
    ): Promise<IOrderDocument> {
        const order: IOrderDocument = await this.orderService.approveOrder(
            orderId,
            reqBody
        );

        return order;
    }

    async sellerDeliverOrder(
        orderId: string,
        reqBody: any
    ): Promise<IOrderDocument> {
        let file: string = reqBody.file;
        const randomBytes: Buffer = await Promise.resolve(
            crypto.randomBytes(20)
        );
        const randomCharacters: string = randomBytes.toString("hex");

        if (file) {
            if (parseInt(reqBody.fileSize) > 10485760) {
                throw new BadRequestError(
                    "File is too large. Maximum is 10Mb",
                    "Update deliverOrder() method"
                );
            }

            const result =
                reqBody.fileType === "zip"
                    ? await uploads(file, `${randomCharacters}.zip`)
                    : await uploads(file);

            if (!result?.public_id) {
                throw new BadRequestError(
                    result?.message ?? "File upload error. Try again",
                    "Update deliverOrder() method"
                );
            }

            file = result?.secure_url;
        }

        const deliveredWork: IDeliveredWork = {
            message: reqBody.message,
            file,
            fileType: reqBody.fileType,
            fileName: reqBody.fileName,
            fileSize: reqBody.fileSize
        };

        const order: IOrderDocument = await this.orderService.deliverOrder(
            orderId,
            true,
            deliveredWork
        );

        return order;
    }
}
