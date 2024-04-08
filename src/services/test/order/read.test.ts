import { databaseConnection } from "@order/database";
import {
    getOrderByOrderId,
    getOrdersByBuyerId,
    getOrdersBySellerId
} from "@order/services/order.service";

describe("Read/Get method", () => {
    beforeAll(async () => {
        await databaseConnection();
    });

    describe("getOrderByOrderId() method", () => {
        it("NotFound case", async () => {
            await expect(getOrderByOrderId("wrong-id")).rejects.toThrow("Order is not found");
        });

        it("Found case", async () => {
            const result = await getOrderByOrderId("JO81090186909");

            expect(result).not.toBeNull();
        });
    });

    describe("getOrdersBySellerId() method", () => {
        it("empty order list case", async () => {
            const result = await getOrdersBySellerId("wrong-id");

            expect(result).toEqual([]);
        });

        it("found order list case", async () => {
            const result = await getOrdersBySellerId(
                "65e9cc7c1d2eacf8631ba73b"
            );

            expect(result).not.toBeNull();
        });
    });

    describe("getOrdersByBuyerId() method", () => {
        it("empty order list case", async () => {
            const result = await getOrdersByBuyerId("wrong-id");

            expect(result).toEqual([]);
        });

        it("found order list case", async () => {
            const result = await getOrdersByBuyerId("65fb82ad94fc785bd3d0be45");

            expect(result).not.toBeNull();
        });
    });
});
