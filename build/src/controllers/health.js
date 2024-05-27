"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.health = void 0;
const http_status_codes_1 = require("http-status-codes");
function health(_req, res) {
    res.status(http_status_codes_1.StatusCodes.OK).send("Order service is healthy and OK.");
}
exports.health = health;
//# sourceMappingURL=health.js.map