/**
 * Parameters required for uploading a file to storage.
 *
 * @property originalname - The original name of the file.
 * @property file - The file content, which can be a Buffer or a string representing the file path.
 * @property mimetype - The MIME type of the file.
 * @property async - Optional flag indicating whether the upload should be asynchronous.
 * @property isPrivate - Optional flag indicating whether the file should be private. Default is false.
 */
export type IUploadFileParams = {
	originalname: string
	file: Buffer | string
	mimetype: string
	async?: boolean
	isPrivate?: boolean
}
export type IUploadFileResponse = {
	url: string
	// The name that file got after it was uploaded
	filename: string
}

export interface IStorageAdapter {
	uploadFile(params: IUploadFileParams): Promise<IUploadFileResponse>
}
