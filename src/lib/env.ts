declare module "bun" {
    interface Env {
        PORT?: number;
        AIRTABLE_API_KEY?: string;
        AIRTABLE_BASE_ID?: string;
        S3_SECRET_ACCESS_KEY?: string;
        S3_ACCESS_KEY_ID?: string;
        S3_REGION?: string;
        S3_BUCKET?: string;
    }
}

export type Environment = "development" | "production"

function parseEnvironmentVariables() {
    // default environment variable values
    const DEFAULT_PORT = 3000;

    const {
        // Server config
        PORT,
        NODE_ENV,

        // Airtable
        AIRTABLE_API_KEY,
        AIRTABLE_BASE_ID,

        // S3 Config
        S3_ACCESS_KEY_ID,
        S3_SECRET_ACCESS_KEY,
        S3_REGION,
        S3_BUCKET,
    } = Bun.env;

    // determine environment
    const ENVIRONMENT: Environment = (NODE_ENV === "development" || NODE_ENV === "production")
        ? NODE_ENV as Environment
        : "production";


    if (!AIRTABLE_API_KEY) {
        throw new Error(`Missing required environment variable: AIRTABLE_API_KEY`);
    }

    if (!AIRTABLE_BASE_ID) {
        throw new Error(`Missing required environment variable: AIRTABLE_BASE_ID`);
    }

    if (!S3_ACCESS_KEY_ID) {
        throw new Error(`Missing required environment variable: S3_ACCESS_KEY_ID`)
    }

    if (!S3_SECRET_ACCESS_KEY) {
        throw new Error(`Missing required environment variable: S3_SECRET_ACCESS_KEY`)
    }

    if (!S3_REGION) {
        throw new Error(`Missing required environment variable: S3_REGION`)
    }

    if (!S3_BUCKET) {
        throw new Error(`Missing required environment variable: S3_BUCKET`)
    }

    return {
        PORT: PORT ?? DEFAULT_PORT,
        ENVIRONMENT,

        AIRTABLE_API_KEY,
        AIRTABLE_BASE_ID,

        S3_ACCESS_KEY_ID,
        S3_SECRET_ACCESS_KEY,
        S3_REGION,
        S3_BUCKET,
    };
}

export const env = parseEnvironmentVariables();
