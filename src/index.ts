import { env } from "./lib/env";
import { addMomentEndpoint, handleAddMoment } from "./handleAddMoment";
import { handleUploadVideo, uploadVideoEndpoint } from "./handleUploadVideo";
import { getVideoHashEndpoint, handleGetVideoHash } from "./handleGetVideoHash";

console.log(`ENVIRONMENT: ${env.ENVIRONMENT}`)

if (env.ENVIRONMENT === "development") {
    console.log(`PORT: ${env.PORT}`)
}

Bun.serve({
    port: env.PORT,

    routes: {
        [addMomentEndpoint]: { POST: handleAddMoment },
        [uploadVideoEndpoint] : { GET: handleUploadVideo },
        [getVideoHashEndpoint]: { GET: handleGetVideoHash }
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
})
