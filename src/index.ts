import { Elysia, env } from "elysia";

declare module "bun" {
    interface Env {
        PORT?: number;
    }
}

const app = new Elysia()
    .get("/", () => "Hello Elysia")
    .listen(env.PORT || 3000);

console.log(
    `Server is running at ${app.server?.hostname}:${app.server?.port}`
);
