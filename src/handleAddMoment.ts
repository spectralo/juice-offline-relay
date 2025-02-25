import { BunRequest } from "bun";
import { z } from "zod";
import { base, getSignupRecord, JuiceStretchFieldSet, OmgMomentFieldSet } from "./lib/airtable";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { env } from "./lib/env";
import { s3Client } from "./lib/s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export const addMomentSchema = z.object({
    stretchId: z.string(),
    description: z.string(),
    startTime: z.date({ coerce: true }),
    stopTime: z.date({ coerce: true }),
    totalPauseTimeSeconds: z.number(),
    videoTitle: z.string(),
});

export const addMomentEndpoint = "/api/moments";

export const handleAddMoment = async (req: BunRequest<typeof addMomentEndpoint>) => {
    const token = req.headers.get("token");
    if (!token) {
        return Response.json({
            success: false,
            message: "Missing token"
        }, {
            status: 401,
            statusText: "Unauthorized"
        });
    }

    const json = await req.json();

    // parse request data from formdata
    const { success, data, error } = await addMomentSchema.safeParseAsync(json)
    if (!success) {
        return Response.json({
            success: false,
            message: error.format(),
        }, {
            status: 400,
            statusText: "Bad Request",
        });
    }

    const {
        description,
        startTime,
        stopTime,
        stretchId,
        totalPauseTimeSeconds,
        videoTitle,
    } = data;

    // get user from database
    const signupRecord = await getSignupRecord(token);

    // respond with 404 when user is not found
    if (!signupRecord) {
        return Response.json({
            success: false,
            message: "User not found",
        }, {
            status: 404,
            statusText: "Not Found",
        });
    }

    // request is now authorized for this record

    // get presigned url to the file location
    const s3FilePath = `omg-moments/${Date.now()}-${videoTitle}`;
    const command = new PutObjectCommand({ Bucket: env.S3_BUCKET, Key: s3FilePath })

    const presignedUrl = await getSignedUrl(s3Client, command, {
        expiresIn: 3600 // valid for 1 hour
    })

    const videoUrl = `https://${env.S3_BUCKET}.s3.amazonaws.com/${s3FilePath}`;

    // create omg moment
    const omgMoment = await base<OmgMomentFieldSet>('omgMoments').create({
        description,
        email: signupRecord.fields.email,
        video: videoUrl,
    });

    // create juice stretch
    await base<JuiceStretchFieldSet>('juiceStretches').create({
        ID: stretchId,
        startTime: startTime.toISOString(),
        endTime: stopTime.toISOString(),
        Signups: [signupRecord.id],
        omgMoments: [omgMoment.id],
        totalPauseTimeSeconds: totalPauseTimeSeconds,
        isOffline: true,
    })

    // respond with success message
    return Response.json({
        success: true,
        message: "Successfully created moment",
        videoUrl: videoUrl,
        presignedUrl: presignedUrl,
    });
};
