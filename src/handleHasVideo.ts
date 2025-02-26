import { BunRequest } from "bun";
import { getOmgMomentRecord, getSignupRecord } from "./lib/airtable";
import { parseS3ObjectUrl, s3Client } from "./lib/s3";
import { env } from "./lib/env";
import { HeadObjectCommand } from "@aws-sdk/client-s3";

export const hasVideoEndpoint = "/api/moments/:stretchId/video/exists";

export const handleHasVideo = async (req: BunRequest<typeof hasVideoEndpoint>) => {
    const token = req.headers.get("token");
    const { stretchId } = req.params;

    if (!token) {
        return Response.json(
            {
                success: false,
                message: "Missing token",
            },
            { status: 401, statusText: "Unauthorized" },
        );
    }

    const signupRecord = await getSignupRecord(token);

    if (!signupRecord) {
        return Response.json(
            {
                success: false,
                message: "Entry for token not found in signup records",
            },
            { status: 401, statusText: "Unauthorized" },
        );
    }

    const omgMomentRecord = await getOmgMomentRecord(stretchId);

    if (!omgMomentRecord) {
        return Response.json(
            {
                success: false,
                message: "Omg moment not found",
            },
            { status: 404, statusText: "Not Found" },
        );
    }

    const { bucket, key } = parseS3ObjectUrl(omgMomentRecord.fields.video);
    if (bucket !== env.S3_BUCKET) throw new Error(`No access to s3 bucket ${bucket}`);

    let hasVideo;
    try {
        const command = new HeadObjectCommand({
            Bucket: bucket,
            Key: key,
        });

        await s3Client.send(command);

        // got 200 / object exists
        hasVideo = true;
    } catch {
        // got 404 / no object found
        hasVideo = false;
    }

    return Response.json({
        success: true,
        hasVideo: hasVideo,
    });
};
