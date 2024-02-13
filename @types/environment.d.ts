export {};

declare global {
    namespace NodeJS {
        interface ProcessEnv {
            PORT: string;
            ENABLE_APM: string;
            DATABASE_URL: string;
            GATEWAY_JWT_TOKEN: string;
            JWT_TOKEN: string;
            NODE_ENV: string;
            CLIENT_URL: string;
            API_GATEWAY_URL: string;
            RABBITMQ_ENDPOINT: string;
            MYSQL_DB: string;
            CLOUD_NAME: string;
            CLOUD_API_KEY: string;
            CLOUD_API_SECRET: string;
            ELASTIC_SEARCH_URL: string;
            ELASTIC_APM_SERVER_URL: string;
            ELASTIC_APM_SECRET_TOKEN: string;
            STRIPE_API_PRIVATE_KEY: string;
        }
    }
}
