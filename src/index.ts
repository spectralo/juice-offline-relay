import { base } from "./lib/airtable";
import { env } from "./lib/env";

console.log(`INFO Environment: ${env.ENVIRONMENT}`)

Bun.serve({
    routes: {
        "/add_moment": {
            POST: async req => {
                try {
                    const formdata = await req.formData();

                    // get token
                    const token = formdata.get('token');
                    if (!token) {
                        return Response.json({
                            success: false,
                            message: "Missing token",
                        }, {
                            status: 400,
                            statusText: "Bad Request",
                        })
                    }

                    // get stretch ID
                    const stretchId = formdata.get('stretchId');
                    if (!stretchId) {
                        return Response.json({
                            success: false,
                            message: "Missing stretchId",
                        }, {
                            status: 400,
                            statusText: "Bad Request",
                        })
                    }

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
                    
                    const record = signupRecords[0];
                    console.log(record.fields);
    
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
