"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const database_1 = require("./database");
const config_1 = require("./config");
const express_1 = __importDefault(require("express"));
const server_1 = require("./server");
const initialize = () => {
    (0, config_1.cloudinaryConfig)();
    (0, database_1.databaseConnection)();
    const app = (0, express_1.default)();
    (0, server_1.start)(app);
};
initialize();
//# sourceMappingURL=app.js.map