import { base, getSignupRecord, OmgMomentFieldSet } from "./lib/airtable";
import { env } from "./lib/env";
import { getFileChecksum as getFileChecksumSHA256, parseS3ObjectUrl } from "./lib/s3";
import { addMomentEndpoint, handleAddMoment } from "./handleAddMoment";
import { handleUploadVideo, uploadVideoEndpoint } from "./handleUploadVideo";

console.log(`ENVIRONMENT: ${env.ENVIRONMENT}`)

if (env.ENVIRONMENT === "development") {
    console.log(`PORT: ${env.PORT}`)
}

Bun.serve({
    routes: {
        [addMomentEndpoint]: { POST: handleAddMoment },
        [uploadVideoEndpoint] : { GET: handleUploadVideo },
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
