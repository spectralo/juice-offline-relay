import { env } from "./env";
import Airtable from "airtable";

export const airtable = new Airtable({
    apiKey: env.AIRTABLE_API_KEY,
});

export const base = airtable.base(env.AIRTABLE_BASE_ID);

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
    Review: ReviewStatus[];
}

export type Achievement =
    | "account_created"
    | "pr_submitted"
    | "pr_merged"
    | "poc_submitted"
    | "poc_accepted";

export interface SignupFieldSet extends Airtable.FieldSet {
    email: string;
    token: string;
    achievements: Achievement[];
    game_pr: string;
    created_at: string;
    juiceStretches: string[];
    jungleStretches: string[];
    inChannel: boolean;
    Slack: string[];
}

export async function getSignupRecord(
    token: string,
): Promise<Airtable.Record<SignupFieldSet> | undefined> {
    const signupRecords = await base<SignupFieldSet>("Signups")
        .select({
            filterByFormula: `{token} = '${escapeSingleQuotes(token)}'`,
            maxRecords: 1,
        })
        .firstPage();

    return signupRecords.at(0);
}

export async function getJuiceStretchRecord(
    stretchId: string,
): Promise<Airtable.Record<JuiceStretchFieldSet> | undefined> {
    const juiceStretchRecords = await base<JuiceStretchFieldSet>("juiceStretches")
        .select({
            filterByFormula: `{ID} = '${stretchId}'`,
            maxRecords: 1,
        })
        .firstPage();

    return juiceStretchRecords.at(0);
}

export async function getOmgMomentRecord(
    juiceStretchID: string,
): Promise<Airtable.Record<OmgMomentFieldSet> | undefined> {
    const omgMomentRecords = await base<OmgMomentFieldSet>("omgMoments")
        .select({
            filterByFormula: `{juiceStretches} = '${juiceStretchID}'`,
            maxRecords: 1,
        })
        .firstPage();

    return omgMomentRecords.at(0);
}
