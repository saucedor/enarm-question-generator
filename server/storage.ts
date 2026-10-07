import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, HeadBucketCommand } from '@aws-sdk/client-s3';
import { required } from './config.js';
export interface ObjectStore {
  put(key: string, bytes: Buffer, type: string): Promise<void>;
  get(key: string): Promise<Buffer>;
  remove(key: string): Promise<void>;
  check(): Promise<void>;
}
export function objectStore(): ObjectStore {
  const client = new S3Client({ endpoint: required('S3_ENDPOINT'), region: process.env.S3_REGION ?? 'auto', credentials: { accessKeyId: required('S3_ACCESS_KEY_ID'), secretAccessKey: required('S3_SECRET_ACCESS_KEY') }, requestHandler: { requestTimeout: 15000, connectionTimeout: 5000 } });
  const Bucket = required('S3_BUCKET');
  return {
    async put(Key, Body, ContentType) { await client.send(new PutObjectCommand({ Bucket, Key, Body, ContentType })); },
    async get(Key) { const result = await client.send(new GetObjectCommand({ Bucket, Key })); if (!result.Body) throw new Error('Empty object'); return Buffer.from(await result.Body.transformToByteArray()); },
    async remove(Key) { await client.send(new DeleteObjectCommand({ Bucket, Key })); },
    async check() { await client.send(new HeadBucketCommand({ Bucket })); },
  };
}
