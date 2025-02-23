declare module "bun" {
    interface Env {
        PORT?: number;
        AIRTABLE_API_KEY?: string;
        AIRTABLE_BASE_ID?: string;
        AIRTABLE_TABLE_NAME?: string;
    }
}

export type Environment = "development" | "production"

function parseEnvironmentVariables() {
    // default environment variable values
    const DEFAULT_PORT = 3000;

    // determine environment
    const ENVIRONMENT: Environment = (Bun.env.NODE_ENV === "development" || Bun.env.NODE_ENV === "production")
        ? Bun.env.NODE_ENV as Environment
        : "production";

    const { PORT, AIRTABLE_API_KEY, AIRTABLE_BASE_ID, AIRTABLE_TABLE_NAME } = Bun.env;

    if (!AIRTABLE_API_KEY) {
        throw new Error(`Missing required environment variable: AIRTABLE_API_KEY`);
    }

    if (!AIRTABLE_BASE_ID) {
        throw new Error(`Missing required environment variable: AIRTABLE_BASE_ID`);
    }

    if (!AIRTABLE_TABLE_NAME) {
        throw new Error(`Missing required environment variable: AIRTABLE_TABLE_NAME`);
    }

    return {
        PORT: PORT ?? DEFAULT_PORT,
        ENVIRONMENT,
        AIRTABLE_API_KEY,
        AIRTABLE_BASE_ID,
        AIRTABLE_TABLE_NAME,
    }
}


export const env = parseEnvironmentVariables();


