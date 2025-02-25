import { BunRequest } from "bun";
import { base, getSignupRecord, OmgMomentFieldSet } from "./lib/airtable";
import { parseS3ObjectUrl, getFileChecksum } from "./lib/s3";
import { env } from "./lib/env";

export const getVideoHashEndpoint = "/api/moments/:stretchId/video/hash";

export const handleGetVideoHash = async (req: BunRequest<typeof getVideoHashEndpoint>) => {
    const token = req.headers.get("token");
    const { stretchId } = req.params;

    if (!token) {
        return Response.json(
            {
                success: false,
                message: "Missing token",
            },
            {
                status: 401,
                statusText: "Unauthorized",
            },
        );
    }

    console.log({ token, stretchId });

    const signupRecord = await getSignupRecord(token);

    if (!signupRecord)
        return Response.json(
            {
                success: false,
                message: "User not found",
            },
            {
                status: 404,
                statusText: "Not Found",
            },
        );

    // request now authorized for signup record

    const omgMoments = await base<OmgMomentFieldSet>("omgMoments")
        .select({
            filterByFormula: `{juiceStretches} = '${stretchId}'`,
            maxRecords: 1,
        })
        .firstPage();

    const omgMoment = omgMoments.at(0);

    if (!omgMoment) {
        return Response.json(
            {
                success: false,
                message: `Juice stretch '${stretchId}' not found`,
            },
            {
                status: 404,
                statusText: "Not Found",
            },
        );
    }

    console.log(omgMoment.fields);
    const { bucket, key } = parseS3ObjectUrl(omgMoment.fields.video);
    if (bucket !== env.S3_BUCKET) throw new Error(`No access to s3 bucket "${bucket}"`);

    console.log({ bucket, key });
    const checksumSHA256 = await getFileChecksum({
        objectKey: key,
        bucket: env.S3_BUCKET,
        algorithm: "sha256",
        encoding: "hex",
    });

    return Response.json({
        success: true,
        message: "Got the hash",
        hash: checksumSHA256,
    });
};
