import { env } from "./lib/env";
import { addMomentEndpoint, handleAddMoment } from "./handleAddMoment";
import { handleUploadVideo, uploadVideoEndpoint } from "./handleUploadVideo";
import { getVideoHashEndpoint, handleGetVideoHash } from "./handleGetVideoHash";

console.log(`Environment: "${env.ENVIRONMENT}"`);

const server = Bun.serve({
    port: env.PORT,

    routes: {
        [addMomentEndpoint]: { POST: handleAddMoment },
        [uploadVideoEndpoint]: { GET: handleUploadVideo },
        [getVideoHashEndpoint]: { GET: handleGetVideoHash },
        // TODO: endpoint to check if moment has video
    },

    error(error) {
        console.error(error);
        return Response.json(
            {
                success: false,
                message: "Internal Server Error",
            },
            {
                status: 500,
                statusText: "Internal Server Error",
            },
        );
    },
});

console.log(`Server listening on ${server.hostname}:${server.port}`);
