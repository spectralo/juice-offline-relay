import { env } from "./lib/env";

console.log(`INFO Environment: ${env.ENVIRONMENT}`)

const server = Bun.serve({
    routes: {
        "/add_moment": req => {
            return Response.json({ message: "Creating moment..." });
        },
    },
    port: env.PORT,
})
