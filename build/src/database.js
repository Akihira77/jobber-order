"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.databaseConnection = void 0;
const config_1 = require("./config");
const mongoose_1 = __importDefault(require("mongoose"));
const databaseConnection = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield mongoose_1.default.connect(config_1.DATABASE_URL);
        (0, config_1.logger)("database.ts - databaseConnection()").info("OrderService MongoDB is connected.");
    }
    catch (error) {
        (0, config_1.logger)("database.ts - databaseConnection()").error("OrderService databaseConnection() method error:", error);
    }
});
exports.databaseConnection = databaseConnection;
//# sourceMappingURL=database.js.map