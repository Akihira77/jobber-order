import { winstonLogger } from "@Akihira77/jobber-shared";
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

describe("Read/Get method", () => {
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
        await db.connection.close();
    });

    describe("getOrderByOrderId() method", () => {
        it("NotFound case", async () => {
            await expect(
                orderService.getOrderByOrderId("wrong-id")
            ).rejects.toThrow("Order is not found");
        });

        it("Found case", async () => {
            const result =
                await orderService.getOrderByOrderId("JO81090186909");

            expect(result).not.toBeNull();
        });
    });

    describe("getOrdersBySellerId() method", () => {
        it("empty order list case", async () => {
            const result = await orderService.getOrdersBySellerId("wrong-id");

            expect(result).toEqual([]);
        });

        it("found order list case", async () => {
            const result = await orderService.getOrdersBySellerId(
                "65e9cc7c1d2eacf8631ba73b"
            );

            expect(result).not.toBeNull();
        });
    });

    describe("getOrdersByBuyerId() method", () => {
        it("empty order list case", async () => {
            const result = await orderService.getOrdersByBuyerId("wrong-id");

            expect(result).toEqual([]);
        });

        it("found order list case", async () => {
            const result = await orderService.getOrdersByBuyerId(
                "65fb82ad94fc785bd3d0be45"
            );

            expect(result).not.toBeNull();
        });
    });
});
