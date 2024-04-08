import { BadRequestError, IOrderDocument } from "@Akihira77/jobber-shared";
import { STRIPE_API_PRIVATE_KEY } from "@order/config";
import { orderSchema } from "@order/schemas/order.schema";
import { createOrder } from "@order/services/order.service";
import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import Stripe from "stripe";

const stripe = new Stripe(STRIPE_API_PRIVATE_KEY!, {
    typescript: true
});

export async function intent(req: Request, res: Response): Promise<void> {
    const customer: Stripe.Response<Stripe.ApiSearchResult<Stripe.Customer>> =
        await stripe.customers.search({
            query: `email:"${req.currentUser!.email}"`
        });
    let customerId: string = customer.data[0]?.id;

    if (customer.data.length === 0) {
        const createdCustomer: Stripe.Response<Stripe.Customer> =
            await stripe.customers.create({
                email: req.currentUser!.email,
                metadata: {
                    buyerId: req.body.buyerId
                }
            });
        customerId = createdCustomer.id;
    }

    let paymentIntent: Stripe.Response<Stripe.PaymentIntent>;

    if (customerId) {
        // the service charge is 5.5% of the purchased amount
        // for purchases under 50$, an additional $2 is applied
        const serviceFee: number =
            req.body.price < 50
                ? (5.5 / 100) * req.body.price + 2
                : (5.5 / 100) * req.body.price;
        paymentIntent = await stripe.paymentIntents.create({
            amount: Math.floor((req.body.price + serviceFee) * 100),
            currency: "usd",
            customer: customerId,
            automatic_payment_methods: {
                enabled: true
            }
        });

        res.status(StatusCodes.CREATED).json({
            message: "Order intent created successfully.",
            clientSecret: paymentIntent.client_secret!,
            paymentIntentId: paymentIntent.id
        });
        return;
    }

    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        message: "Unexpected error occured. Please try again",
    });
}

export async function order(req: Request, res: Response): Promise<void> {
    const { error } = await Promise.resolve(orderSchema.validate(req.body));

    if (error?.details) {
        throw new BadRequestError(
            error.details[0].message,
            "Create order() method"
        );
    }

    // the service charge is 5.5% of the purchased amount
    // for purchases under 50$, an additional $2 is applied
    const serviceFee: number =
        req.body.price < 50
            ? (5.5 / 100) * req.body.price + 2
            : (5.5 / 100) * req.body.price;
    let orderData: IOrderDocument = req.body;
    orderData.serviceFee = serviceFee;
    const order: IOrderDocument = await createOrder(orderData);

    res.status(StatusCodes.CREATED).json({
        message: "Order created successfully.",
        order
    });
}
