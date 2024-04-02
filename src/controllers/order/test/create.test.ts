// import { Request, Response } from "express";
// import {
//     authUserPayload,
//     orderDocument,
//     orderMockRequest,
//     orderMockResponse
// } from "@order/controllers/order/test/mocks/order.mock";
// import * as create from "@order/controllers/order/create";
// import * as helper from "@Akihira77/jobber-shared";
// import { orderSchema } from "@order/schemas/order.schema";
// import { BadRequestError } from "@Akihira77/jobber-shared";
// import * as orderService from "@order/services/order.service";

// jest.mock("@Akihira77/jobber-shared");
// jest.mock("@order/services/order.service");
// jest.mock("@order/schemas/order.schema");
// jest.mock("@elastic/elasticsearch");

// const mockPaymentIntentsCreate = jest.fn();
// const mockCustomersSearch = jest.fn();

// jest.mock("stripe", () => {
//     return {
//         __esModule: true,
//         default: jest.fn(() => ({
//             paymentIntents: {
//                 create: (...args: any) =>
//                     mockPaymentIntentsCreate(...args) as unknown
//             },
//             customers: {
//                 search: (...args: any) =>
//                     mockCustomersSearch(...args) as unknown
//             }
//         }))
//     };
// });

// describe("Order Controller", () => {
//     beforeEach(() => {
//         jest.resetAllMocks();
//     });

//     afterEach(() => {
//         jest.clearAllMocks();
//     });

//     describe("Create intent method", () => {
//         it("Should create a new intent and return the correct response", async () => {
//             const req: Request = orderMockRequest(
//                 {},
//                 orderDocument,
//                 authUserPayload
//             ) as unknown as Request;
//             const res: Response = orderMockResponse();

//             mockCustomersSearch.mockResolvedValueOnce({
//                 data: [{ id: "1234141" }]
//             });
//             mockPaymentIntentsCreate.mockResolvedValueOnce({
//                 client_secret: "1231232",
//                 id: "1231212"
//             });
//             await create.intent(req, res);

//             expect(res.status).toHaveBeenCalledWith(201);
//             expect(res.json).toHaveBeenCalledWith({
//                 message: "Order intent created successfully.",
//                 clientSecret: "1231232",
//                 paymentIntentId: "1231212"
//             });
//         });

//         it("should throw an error for invalid schema data", async () => {
//             const req: Request = orderMockRequest(
//                 {},
//                 orderDocument,
//                 authUserPayload
//             ) as unknown as Request;
//             const res: Response = orderMockResponse();
//             jest.spyOn(orderSchema, "validate").mockImplementation((): any =>
//                 Promise.resolve({
//                     error: {
//                         name: "ValidationError",
//                         isJoi: true,
//                         details: [{ message: "This is an error message" }]
//                     }
//                 })
//             );

//             create.order(req, res).catch(() => {
//                 expect(BadRequestError).toHaveBeenCalledWith(
//                     "This is an error message",
//                     "Create order() method"
//                 );
//             });
//         });

//         it("should return correct json response", async () => {
//             const req: Request = orderMockRequest(
//                 {},
//                 orderDocument,
//                 authUserPayload
//             ) as unknown as Request;
//             const res: Response = orderMockResponse();
//             const serviceFee: number =
//                 req.body.price < 50
//                     ? (5.5 / 100) * req.body.price + 2
//                     : (5.5 / 100) * req.body.price;
//             let orderData: helper.IOrderDocument = req.body;
//             orderData.serviceFee = serviceFee;

//             jest.spyOn(orderSchema, "validate").mockImplementation((): any =>
//                 Promise.resolve({ error: {} })
//             );
//             jest.spyOn(orderService, "createOrder").mockImplementation(
//                 (): any => Promise.resolve(orderData)
//             );

//             await create.order(req, res);
//             expect(res.status).toHaveBeenCalledWith(201);
//             expect(res.json).toHaveBeenCalledWith({
//                 message: "Order created successfully.",
//                 order: orderData
//             });
//         });
//     });
// });
