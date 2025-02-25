import { env } from "./env";
import Airtable from "airtable";

export const airtable = new Airtable({
    apiKey: env.AIRTABLE_API_KEY,
})

export const base = airtable.base(env.AIRTABLE_BASE_ID)

export function escapeSingleQuotes(v: string): string {
    return v.trim().replace(/\'/g, "\\\'");
}

export interface JuiceStretchFieldSet extends Airtable.FieldSet {
    ID: string;
    startTime: string;
    endTime: string;
    totalPauseTimeSeconds: number;
    Signups: string[];
    omgMoments: string[];
    Review: ReviewStatus;
    isOffline: boolean;
    isCancelled: boolean;
    pauseTimeStart: string;
}

export type ReviewStatus = "Pending" | "Accepted" | "Rejected";

export interface OmgMomentFieldSet extends Airtable.FieldSet {
    description: string;
    video: string;
    juiceStretches: string[];
    Review: ReviewStatus;
}

export interface SignupFieldSet extends Airtable.FieldSet { }

export async function getSignupRecord(token: string): Promise<Airtable.Record<SignupFieldSet> | undefined> {
    const signupRecords = await base("Signups").select({
        filterByFormula: `{token} = '${escapeSingleQuotes(token)}'`,
        maxRecords: 1,
    }).firstPage();

    if (signupRecords.length === 0) return undefined;

    return signupRecords[0];
}

