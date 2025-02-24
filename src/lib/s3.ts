import { S3Client } from "bun";
import { env } from "./env";

export const s3 = new S3Client({
    accessKeyId: env.S3_ACCESS_KEY_ID,
    secretAccessKey: env.S3_SECRET_ACCESS_KEY,
    region: env.S3_REGION,
    bucket: env.S3_BUCKET,
    endpoint: `s3.amazonaws.com`
});
