import { DigestEncoding, SupportedCryptoAlgorithms } from "bun";
import { env } from "./env";
import { S3Client, HeadObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";

export const s3Client = new S3Client({
    region: env.S3_REGION,
    credentials: {
        accessKeyId: env.S3_ACCESS_KEY_ID,
        secretAccessKey: env.S3_SECRET_ACCESS_KEY,
    },
});

export async function getFileChecksum({
    objectKey,
    algorithm,
    encoding,
    bucket = env.S3_BUCKET,
}: {
    objectKey: string;
    algorithm: SupportedCryptoAlgorithms;
    encoding: DigestEncoding;
    bucket?: string;
}) {
    const command = new GetObjectCommand({
        Bucket: bucket,
        Key: objectKey,
    });
    const response = await s3Client.send(command);

    if (response.Body) {
        const buffer = await response.Body.transformToByteArray();
        return Bun.CryptoHasher.hash(algorithm, buffer, encoding);
    }

    return undefined;
}

export function parseS3ObjectUrl(s3Url: string) {
    const url = new URL(s3Url);
    const hostParts = url.hostname.split(".");

    let bucket: string;
    let key: string;

    // Virtual-hosted style: bucket.s3.amazonaws.com/key
    if (hostParts.length >= 3 && hostParts[1] === "s3") {
        bucket = hostParts[0];
        key = url.pathname.slice(1); // remove the leading "/"
    } else {
        // Path-style: s3.amazonaws.com/bucket/key
        const parts = url.pathname.split("/").filter(Boolean); // filter falsy values

        bucket = parts.shift() ?? "";
        key = parts.join("/");
    }

    return { bucket, key };
}
