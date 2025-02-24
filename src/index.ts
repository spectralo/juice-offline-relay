import { z } from "zod";
import { base } from "./lib/airtable";
import { env } from "./lib/env";
import Airtable from "airtable";
import { s3 } from "./lib/s3";

console.log(`ENVIRONMENT: ${env.ENVIRONMENT}`)

if (env.ENVIRONMENT === "development") {
    console.log(`PORT: ${env.PORT}`)
}

// How do we want to handle the api difference here?
// on the website it's starts and stops via a request to ensure correctness via server validation
// now however, we have it all client side.
// So there should be one add_moment endpoint that creates the start and stop time and everything.

const momentSchema = z.object({
    token: z.string(),
    stretchId: z.string(),
    description: z.string(),
    startTime: z.date({ coerce: true }),
    stopTime: z.date({ coerce: true }),
    totalPauseTimeSeconds: z.number(),
    videoTitle: z.string(),
});

type ReviewStatus = "Pending" | "Accepted" | "Rejected";

interface JuiceStretchFields extends Airtable.FieldSet {
    ID: string,
    startTime: string,
    endTime: string,
    totalPauseTimeSeconds: number,
    Signups: string[],
    omgMoments: string[],
    Review: ReviewStatus,
    isOffline: boolean,
    isCancelled: boolean,
    pauseTimeStart: string,
}

interface OmgMomentFields extends Airtable.FieldSet {
    description: string,
    video: string,
    juiceStretches: string[],
    Review: ReviewStatus,
}

Bun.serve({
    routes: {
        "/api/offline/add_moment": {
            POST: async req => {
                try {
                    const json = await req.json();

                    // parse request data from formdata
                    const { success, data, error } = await momentSchema.safeParseAsync(json)
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
                        token,
                        description,
                        startTime,
                        stopTime,
                        stretchId,
                        totalPauseTimeSeconds,
                        videoTitle,
                    } = data;

                    // get user from database
                    const signupRecords = await base("Signups").select({
                        filterByFormula: `{token} = '${token}'`,
                        maxRecords: 1,
                    }).firstPage();

                    // respond with 404 when user is not found
                    if (!signupRecords || signupRecords.length === 0) {
                        return Response.json({
                            success: false,
                            message: "User not found",
                        }, {
                            status: 404,
                            statusText: "Not Found",
                        })
                    }

                    // request is now authorized for this record
                    const signupRecord = signupRecords[0];
                    
                    // create file reference to s3
                    const s3FilePath = `omg-moments/${Date.now()}-${videoTitle}`;
                    const file = s3.file(s3FilePath);
                    const videoUrl = `https://${file.bucket}.s3.amazonaws.com/${s3FilePath}`;
                    
                    // initialize file and get presigned url
                    const presignedUrl = file.presign({
                        expiresIn: 8 * 60 * 60, // valid for 8 hours
                        method: "PUT",
                    })

                    // create omg moment
                    const omgMoments = await base<OmgMomentFields>('omgMoments').create([
                        {
                            fields: {
                                description,
                                email: signupRecord.fields.email,
                                video: videoUrl,
                            }
                        }
                    ]);
                    const omgMoment = omgMoments[0];

                    // create juice stretch
                    await base<JuiceStretchFields>('juiceStretches').create([
                        {
                            fields: {
                                ID: stretchId,
                                startTime: startTime.toISOString(),
                                endTime: stopTime.toISOString(),
                                Signups: [signupRecord.id],
                                omgMoments: [omgMoment.id],
                                totalPauseTimeSeconds: totalPauseTimeSeconds,
                                isOffline: true,
                            }
                        }
                    ])

                    // respond with success message
                    return Response.json({
                        success: true,
                        message: "Successfully created moment",
                        videoUrl: videoUrl,
                        presignedUrl: presignedUrl,
                    });
                } catch (e) {
                    console.error(e);
                    return Response.json({
                        success: false,
                        message: "Failed to create moment"
                    }, {
                        status: 500,
                        statusText: "Internal Server Error",
                    })
                }
            }
        },
    },
    port: env.PORT,
})
