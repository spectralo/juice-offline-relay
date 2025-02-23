import { Elysia } from "elysia";
import { env } from "./lib/env";

console.log(`INFO Environment: ${env.ENVIRONMENT}`)

const app = new Elysia()
    .post("/add_moment", () => {
        console.log("Adding moment...")
        return;
    })
    .listen(env.PORT);

console.log(
    `INFO Server is running at ${app.server?.hostname}:${app.server?.port}`
);
