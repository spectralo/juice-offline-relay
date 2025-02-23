import Airtable from "airtable";
import { env } from "./env";

export const airtable = new Airtable({
    apiKey: env.AIRTABLE_API_KEY,
})

export const base = airtable.base(env.AIRTABLE_BASE_ID)