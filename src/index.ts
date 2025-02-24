import { base } from "./lib/airtable";
import { env } from "./lib/env";
import { v4 as uuid } from 'uuid';

console.log(`INFO Environment: ${env.ENVIRONMENT}`)
console.log(`INFO Date: ${new Date().toISOString()}`)


// How do we want to handle the api difference here?
// on the website it's starts and stops via a request to ensure correctness via server validation
// now however, we have it all client side.
// So there should be one add_moment endpoint that creates the start and stop time and everything.

Bun.serve({
    routes: {
        "/start_juice_stretch": {
            POST: async req => {
                return Response.json({
                    success: true,
                    message: "Successfully started ",
                }, {
                    status: 500,
                    statusText: "Internal Server Error",
                })
            }
        },
        "/stop_juice_stretch": {
            POST: async req => {
                try {
                    const formdata = await req.formData();

                    // get token
                    const tokenEntry = formdata.get('token');
                    if (!tokenEntry) {
                        return Response.json({
                            success: false,
                            message: "Missing token",
                        }, {
                            status: 400,
                            statusText: "Bad Request",
                        });
                    }
                    const token = tokenEntry instanceof File
                        ? await tokenEntry.text() // read file
                        : tokenEntry; // string

                    // get stretch ID
                    const stretchIdEntry = formdata.get('stretchId');
                    if (!stretchIdEntry) {
                        return Response.json({
                            success: false,
                            message: "Missing stretchId",
                        }, {
                            status: 400,
                            statusText: "Bad Request",
                        });
                    }
                    const stretchId = stretchIdEntry instanceof File
                        ? await stretchIdEntry.text() // read file
                        : stretchIdEntry; // string

                    // get description
                    const descriptionEntry = formdata.get('description');
                    if (!descriptionEntry) {
                        return Response.json({
                            success: false,
                            message: "Missing description",
                        }, {
                            status: 400,
                            statusText: "Bad Request",
                        });
                    }
                    const description = descriptionEntry instanceof File
                        ? await descriptionEntry.text() // read file
                        : descriptionEntry; // string

                    // get stopTime
                    const stopTimeEntry = formdata.get('stopTime');
                    if (!stopTimeEntry) {
                        return Response.json({
                            success: false,
                            message: "Missing stopTime",
                        }, {
                            status: 400,
                            statusText: "Bad Request",
                        });
                    }
                    const stopTime = stopTimeEntry instanceof File
                        ? await stopTimeEntry.text()
                        : stopTimeEntry;

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
                    
                    const signupRecord = signupRecords[0];
                    console.log(signupRecord.fields);

                    const omgMoment = await base('omgMoments').create([
                        {
                            fields: {
                                description,
                                email: signupRecord.fields.email,
                            }
                        }
                    ])

                    // TODO: Handle Video as URL somewhere
                    // (s3? do we have an api?)

                    await base('juiceStretches').update([
                        {
                            id: stretchId,
                            fields: {
                                endTime: stopTime,
                                omgMoment: [omgMoment[0].id]
                            }
                        }
                    ])


                    console.log(omgMoment);

                    // respond with success message
                    return Response.json({
                        success: true,
                        message: "Successfully created moment",
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
