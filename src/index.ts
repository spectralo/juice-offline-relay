import { env } from "./lib/env";
import { STATUS_BAD_REQUEST, statusText } from "./lib/http";

console.log(`INFO Environment: ${env.ENVIRONMENT}`)

const server = Bun.serve({
    routes: {
        "/add_moment": {
            POST: async (request, server) => {
                let data: {
                    token: string;
                } | undefined = undefined;
                try {
                    let data = await request.json();
                    console.log(data);
                } catch (e) {
                    console.error(e);
                    return Response.json({
                        success: false,
                        message: "Could not parse request data."
                    }, {
                        status: STATUS_BAD_REQUEST,
                        statusText: statusText(STATUS_BAD_REQUEST),
                    })
                }

                return Response.json({
                    success: true,
                    message: "Creating moment...",
                });
            }
        },
    },
    port: env.PORT,
})
