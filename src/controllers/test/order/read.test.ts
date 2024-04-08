import { app } from "@order/app";
import { databaseConnection } from "@order/database";
import { start } from "@order/server";
import supertest from "supertest";

const serverApp = app;
const orderApi = "/api/v1/order";

describe("Order Controller - Read/Get method", () => {
    beforeAll(async () => {
        await databaseConnection();

        start(serverApp);
    });

    it("NotFound by orderId case", async () => {
        const { body, statusCode } = await supertest(serverApp).get(
            `${orderApi}/wrong-user-to-name`
        );

        expect(body).toEqual({
            comingFrom: "getOrderByOrderId() method",
            message: `Order is not found`,
            status: "error",
            statusCode: 404
        });
        expect(statusCode).toEqual(404);
    });

    it("Empty order list by sellerId case", async () => {
        const { body, statusCode } = await supertest(serverApp).get(
            `${orderApi}/seller/Plankton`
        );

        expect(body).toEqual({ message: "Seller orders", orders: [] });
        expect(statusCode).toEqual(200);
    });

    it("Empty order list by buyerId case", async () => {
        const { body, statusCode } = await supertest(serverApp).get(
            `${orderApi}/buyer/Patrick`
        );

        expect(body).toEqual({ message: "Buyer orders", orders: [] });
        expect(statusCode).toEqual(200);
    });

    it("Found by orderId case", async () => {
        const { body, statusCode } = await supertest(serverApp).get(
            `${orderApi}/JO81090186909`
        );

        expect(body.message).toEqual("Order by orderId");
        expect(body.order).toBeTruthy();
        expect(statusCode).toEqual(200);
    });

    it("Order list by buyerId case", async () => {
        const { body, statusCode } = await supertest(serverApp).get(
            `${orderApi}/buyer/65fb82ad94fc785bd3d0be45`
        );

        expect(body.message).toEqual("Buyer orders");
        expect(body.orders).toBeTruthy();
        expect(statusCode).toEqual(200);
    });

    it("Order list by sellerId case", async () => {
        const { body, statusCode } = await supertest(serverApp).get(
            `${orderApi}/seller/65e9cc7c1d2eacf8631ba73b`
        );

        expect(body.message).toEqual("Seller orders");
        expect(body.orders).toBeTruthy();
        expect(statusCode).toEqual(200);
    });
});
