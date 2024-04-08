import { app } from "@order/app";
import { databaseConnection } from "@order/database";
import { start } from "@order/server";
import supertest from "supertest";

const serverApp = app;
const orderApi = "/api/v1/order";

describe("Notification Controller - Update method", () => {
    beforeAll(async () => {
        await databaseConnection();

        start(serverApp);
    });

    it("Not valid notificationId case", async () => {
        const { body, statusCode } = await supertest(serverApp)
            .put(`${orderApi}/notification/mark-as-read`)
            .send({ notificationId: "wrong-notification-id" });

        expect(body.notification).toEqual({});
        expect(body.message).toEqual(
            "Notification read status updated successfully."
        );
        expect(statusCode).toEqual(200);
    });

    it("NotFound case", async () => {
        const { body, statusCode } = await supertest(serverApp)
            .put(`${orderApi}/notification/mark-as-read`)
            .send({ notificationId: "660246d911906db940f1c749" });

        expect(body).toEqual({
            comingFrom: "markNotificationAsRead() method",
            message: `OrderNotification is not found`,
            status: "error",
            statusCode: 404
        });
        expect(statusCode).toEqual(404);
    });

    it("valid notificationId case", async () => {
        const result = await supertest(serverApp).get(
            `${orderApi}/notifications/Lucile`
        );

        const { body, statusCode } = await supertest(serverApp)
            .put(`${orderApi}/notification/mark-as-read`)
            .send({ notificationId: result.body.notifications[0]._id });

        expect(body.notification).not.toBeNull();
        expect(body.message).toEqual(
            "Notification read status updated successfully."
        );
        expect(statusCode).toEqual(200);
    });
});
