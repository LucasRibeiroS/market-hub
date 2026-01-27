import { createReadStream } from 'node:fs'
import { randomBytes } from 'node:crypto'
import { CompleteMultipartUploadCommandOutput } from '@aws-sdk/client-s3'
import { Upload } from '@aws-sdk/lib-storage'

import { s3Client } from '@clients/s3'

import {
	IStorageAdapter,
	IUploadFileParams,
	IUploadFileResponse
} from '@storage/IStorageAdapter'

export class ObjectStorageAdapter implements IStorageAdapter {
	constructor() {
		this.validateEnv()
	}

	private BASE_URL = `https://${process.env.OBJECT_STORAGE_BUCKET_NAME!}.${process.env.OBJECT_STORAGE_ENDPOINT}`

	async uploadFile({
		file, originalname, mimetype, async, isPrivate
	}: IUploadFileParams): Promise<IUploadFileResponse> {
		const filename = `${randomBytes(8).toString('hex')}-${originalname}`
		const body = typeof file === 'string' ? createReadStream(file) : file

		const folderPrefix = isPrivate ? 'private' : 'public'

		const upload = new Upload({
			params: {
				Bucket: process.env.OBJECT_STORAGE_BUCKET_NAME,
				Key: `${folderPrefix}/${filename}`,
				Body: body,
				ContentType: mimetype,
				ACL: isPrivate ? 'private' : 'public-read'
			},
			client: s3Client,
			queueSize: 4
		})

		if (async) {
			upload.done().catch(error => console.error(error))
			return {
				url: `${this.BASE_URL}/${folderPrefix}/${filename}`,
				filename
			}
		}

		const uploadResponse = await upload
			.done()
			.then((response: CompleteMultipartUploadCommandOutput) => response.Location)
			.catch(error => console.error(error))
		if (uploadResponse === undefined) {
			throw new Error('Error when uploading file to object storage')
		}

		return { url: uploadResponse, filename }
	}

	private validateEnv(): void {
		if (!process.env.OBJECT_STORAGE_ACCESS_KEY_ID) {
			throw new Error('Invalid environment variables: "OBJECT_STORAGE_ACCESS_KEY_ID" is required')
		}
		if (!process.env.OBJECT_STORAGE_ACCESS_KEY_SECRET) {
			throw new Error('Invalid environment variables: "OBJECT_STORAGE_ACCESS_KEY_SECRET" is required')
		}
		if (!process.env.OBJECT_STORAGE_BUCKET_NAME) {
			throw new Error('Invalid environment variables: "OBJECT_STORAGE_BUCKET_NAME" is required')
		}
		if (!process.env.OBJECT_STORAGE_ENDPOINT) {
			throw new Error('Invalid environment variables: "OBJECT_STORAGE_ENDPOINT" is required')
		}
	}
}