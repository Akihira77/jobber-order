import { Client } from "@elastic/elasticsearch";
import { ClusterHealthResponse } from "@elastic/elasticsearch/lib/api/types";
import { ELASTIC_SEARCH_URL, logger } from "@order/config";

export const elasticSearchClient = new Client({
    node: ELASTIC_SEARCH_URL
});

export async function checkConnection(): Promise<void> {
    let isConnected = false;
    while (!isConnected) {
        logger("elasticsearch.ts - checkConnection()").info(
            "OrderService connecting to Elasticsearch..."
        );
        try {
            const health: ClusterHealthResponse =
                await elasticSearchClient.cluster.health({});

            logger("elasticsearch.ts - checkConnection()").info(
                `OrderService Elasticsearch health status - ${health.status}`
            );

            isConnected = true;
        } catch (error) {
            logger("elasticsearch.ts - checkConnection()").error(
                "Connection to Elasticsearch failed. Retrying..."
            );
            logger("elasticsearch.ts - checkConnection()").error(
                "OrderService checkConnection() method error:",
                error
            );
        }
    }
}
