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
Object.defineProperty(exports, "__esModule", { value: true });
exports.ElasticSearchClient = void 0;
const elasticsearch_1 = require("@elastic/elasticsearch");
const config_1 = require("./config");
class ElasticSearchClient {
    constructor(logger) {
        this.logger = logger;
        this.client = new elasticsearch_1.Client({
            node: `${config_1.ELASTIC_SEARCH_URL}`,
            Connection: elasticsearch_1.HttpConnection
        });
    }
    checkConnection() {
        return __awaiter(this, void 0, void 0, function* () {
            let isConnected = false;
            while (!isConnected) {
                this.logger("elasticsearch.ts - checkConnection()").info("OrderService connecting to Elasticsearch...");
                try {
                    const health = yield this.client.cluster.health({});
                    this.logger("elasticsearch.ts - checkConnection()").info(`OrderService Elasticsearch health status - ${health.status}`);
                    isConnected = true;
                }
                catch (error) {
                    this.logger("elasticsearch.ts - checkConnection()").error("Connection to Elasticsearch failed. Retrying...");
                    this.logger("elasticsearch.ts - checkConnection()").error("OrderService checkConnection() method error:", error);
                }
            }
        });
    }
}
exports.ElasticSearchClient = ElasticSearchClient;
//# sourceMappingURL=elasticsearch.js.map