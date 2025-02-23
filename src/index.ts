import { Elysia, env } from "elysia";

const PORT = 3000;

const app = new Elysia()
    .get("/", () => "Hello Elysia")
    .listen(PORT);

console.log(
    `Server is running at ${app.server?.hostname}:${app.server?.port}`
);
