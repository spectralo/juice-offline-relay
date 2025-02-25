import { BunRequest } from "bun";
import { getJuiceStretchRecord, getOmgMomentRecord, getSignupRecord } from "./lib/airtable";
import { parseS3ObjectUrl, s3Client } from "./lib/s3";
import { env } from "./lib/env";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export const uploadVideoEndpoint = "/api/moments/:stretchId/video/upload";

export const handleUploadVideo = async (req: BunRequest<typeof uploadVideoEndpoint>) => {
    const token = req.headers.get("token");
    const { stretchId } = req.params;

    if (!token) {
        return Response.json({
            success: false,
            message: "Missing token",
        }, { status: 401, statusText: "Unauthorized" });
    }

    const signupRecord = await getSignupRecord(token);
    if (!signupRecord) {
        return Response.json({
            success: false,
            message: "Entry for token not found in signup records",
        }, { status: 401, statusText: "Unauthorized" })
    }

    const juiceStretch = await getJuiceStretchRecord(stretchId);
    if (!juiceStretch) {
        return Response.json({
            success: false,
            message: "Stretch not found",
        }, { status: 404, statusText: "Not Found" });
    }

    // ensure the user is allowed to access the stretch
    const isAuthorized = juiceStretch.fields.Signups.includes(signupRecord.id);
    if (!isAuthorized) return Response.json({
        success: false,
        message: `Unauthorized to access stretch ${stretchId}`,
    }, { status: 401, statusText: "Unauthorized" })

    const omgMoment = await getOmgMomentRecord(juiceStretch);

    if (!omgMoment) {
        return Response.json({
            success: false,
            message: "Omg moment not found",
        }, {
            status: 404,
            statusText: "Not Found",
        });
    }

    if (omgMoment.fields.Review[0] !== "Pending") {
        return Response.json({
            success: false,
            message: "Omg moment has already been reviewed and cannot be overwritten",
            reviewStatus: omgMoment.fields.Review[0],
        }, { status: 409, statusText: "Conflict" })
    }

    const { bucket, key } = parseS3ObjectUrl(omgMoment.fields.video);
    if (bucket !== env.S3_BUCKET) throw new Error(`No access to s3 bucket ${bucket}`);

    const command = new PutObjectCommand({
        Bucket: bucket,
        Key: key,
    });

    const presignedUrl = await getSignedUrl(s3Client, command, {
        expiresIn: 3600, // valid for 1 hour
    });

    return Response.json({
        success: true,
        message: "Got the presigned url",
        presignedUrl: presignedUrl,
    });
}