import { S3Client } from '@aws-sdk/client-s3'

export const s3Client = new S3Client({
	region: process.env.OBJECT_STORAGE_REGION,
	credentials: {
		accessKeyId: process.env.OBJECT_STORAGE_ACCESS_KEY_ID || '',
		secretAccessKey: process.env.OBJECT_STORAGE_ACCESS_KEY_SECRET || ''
	}
})