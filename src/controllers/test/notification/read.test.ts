import { app } from "@order/app";
import { databaseConnection } from "@order/database";
import { start } from "@order/server";
import supertest from "supertest";

const serverApp = app;
const orderApi = "/api/v1/order";

describe("Notification Controller - Read/Get method", () => {
    beforeAll(async () => {
        await databaseConnection();

        start(serverApp);
    });

    it("Empty notification list case", async () => {
        const { body, statusCode } = await supertest(serverApp).get(
            `${orderApi}/notifications/wrong-user-to-name`
        );

        expect(statusCode).toEqual(200);
        expect(body).toEqual({
            message: "Notifications",
            notifications: []
        });
    });

    it("Get notification list case", async () => {
        const { body, statusCode } = await supertest(serverApp).get(
            `${orderApi}/notifications/Lucile`
        );

        expect(statusCode).toEqual(200);
        expect(body.message).toEqual("Notifications");
        expect(body.notifications).not.toBeNull();
    });
});
