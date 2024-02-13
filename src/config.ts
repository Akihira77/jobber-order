import dotenv from "dotenv";
import cloudinary from "cloudinary";

if (process.env.NODE_ENV !== "production") {
    dotenv.config({ path: "./.env" });
} else {
    dotenv.config();
}

export const {
    CLOUD_API_KEY,
    CLOUD_API_SECRET,
    CLOUD_NAME,
    CLIENT_URL,
    ELASTIC_SEARCH_URL,
    GATEWAY_JWT_TOKEN,
    API_GATEWAY_URL,
    JWT_TOKEN,
    NODE_ENV,
    RABBITMQ_ENDPOINT,
    DATABASE_URL,
    STRIPE_API_PRIVATE_KEY
} = process.env;

export const cloudinaryConfig = () =>
    cloudinary.v2.config({
        cloud_name: CLOUD_NAME,
        api_key: CLOUD_API_KEY,
        api_secret: CLOUD_API_SECRET
    });

export const exchangeNamesAndRoutingKeys = {
    notificationService: {
        email: {
            exchangeName: "jobber-email-notification",
            routingKey: "auth-email"
        },
        order: {
            exchangeName: "jobber-order-notification",
            routingKey: "order-email"
        }
    },
    buyerService: {
        buyer: {
            exchangeName: "jobber-buyer-update",
            routingKey: "user-buyer"
        },
        seller: {
            exchangeName: "jobber-seller-update",
            routingKey: "user-seller"
        }
    },
    reviewService: {
        review: {
            exchangeName: "jobber-review"
        }
    },
    gigService: {
        updateGig: {
            exchangeName: "jobber-update-gig",
            routingKey: "update-gig"
        },
        getSellers: {
            exchangeName: "jobber-gig",
            routingKey: "get-sellers"
        },
        seed: {
            exchangeName: "jobber-seed-gig",
            routingKey: "receive-sellers"
        }
    }
};
