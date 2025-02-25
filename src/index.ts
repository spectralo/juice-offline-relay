import { z } from "zod";
import { base, getJuiceStretchRecord, getOmgMomentRecord, getSignupRecord, JuiceStretchFieldSet, OmgMomentFieldSet } from "./lib/airtable";
import { env } from "./lib/env";
import { getFileChecksum as getFileChecksumSHA256, parseS3ObjectUrl, s3Client } from "./lib/s3";
import { ErrorDetails, GetObjectCommand, HeadObjectCommand, HeadObjectCommandOutput, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { addMomentEndpoint, handleAddMoment } from "./handleAddMoment";

console.log(`ENVIRONMENT: ${env.ENVIRONMENT}`)

if (env.ENVIRONMENT === "development") {
    console.log(`PORT: ${env.PORT}`)
}

Bun.serve({
    routes: {
        [addMomentEndpoint]: { POST: handleAddMoment },
        "/api/moments/:stretchId/video/upload": {
            GET: async req => {
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
                    }, { status: 401, statusText: "Unauthorized"})
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
        },
        "/api/moments/:stretchId/video/hash": {
            GET: async req => {
                const token = req.headers.get("token");
                const { stretchId } = req.params;

                if (!token) {
                    return Response.json({
                        success: false,
                        message: "Missing token",
                    }, {
                        status: 401,
                        statusText: "Unauthorized",
                    });
                }

                console.log({ token, stretchId })

                const signupRecord = await getSignupRecord(token);
                
                if (!signupRecord) return Response.json({
                    success: false,
                    message: "User not found"
                }, {
                    status: 404,
                    statusText: "Not Found"
                });

                // request now authorized for signup record

                const omgMoments = await base<OmgMomentFieldSet>('omgMoments').select({
                    filterByFormula: `{juiceStretches} = '${stretchId}'`,
                    maxRecords: 1,
                }).firstPage();

                const omgMoment = omgMoments.at(0);

                if (!omgMoment) {
                    return Response.json({
                        success: false,
                        message: `Juice stretch '${stretchId}' not found`
                    }, {
                        status: 404,
                        statusText: "Not Found",
                    })
                }

                console.log(omgMoment.fields);
                const { bucket, key } = parseS3ObjectUrl(omgMoment.fields.video);
                if (bucket !== env.S3_BUCKET) throw new Error(`No access to s3 bucket "${bucket}"`)

                console.log({ bucket, key })
                const checksumSHA256 = await getFileChecksumSHA256({
                    objectKey: key,
                    bucket: env.S3_BUCKET,
                    algorithm: "sha256",
                    encoding: "hex",
                })

                return Response.json({
                    success: true,
                    message: "Got the hash",
                    hash: checksumSHA256,
                })
            }
        }
    },
    error(error) {
        console.error(error);
        return Response.json({
            success: false,
            message: "Internal Server Error",
        }, {
            status: 500,
            statusText: "Internal Server Error",
        })
    },
    port: env.PORT,
})
