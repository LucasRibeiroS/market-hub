import { CipherGCM, CipherGCMOptions, createCipheriv, createDecipheriv, createHmac, DecipherGCM, randomBytes, scryptSync } from 'node:crypto'

import { env } from '@config/env'

const ALGORITHM = {
	BLOCK_CIPHER: 'aes-256-gcm',
	KEY: new Uint8Array(scryptSync(
		env.ENCRYPTION_KEY,
		new Uint8Array(Buffer.from(env.ENCRYPTION_SALT, 'hex')),
		32 // derived key length in bytes, 32 bytes for AES-256
	)),

	/**
     * 128 bit auth tag is recommended for GCM
     */
	AUTH_TAG_BYTE_LEN: 16,

	/**
     * NIST recommends 96 bits or 12 bytes IV for GCM to promote interoperability, efficiency, and simplicity of design
     */
	IV_BYTE_LEN: 12
}

const getIV = (): Uint8Array => {
	return new Uint8Array(randomBytes(ALGORITHM.IV_BYTE_LEN))
}

/**
 * Encrypts a plain text string using AES-256-GCM algorithm.
 *
 * @param text - The plain text string to encrypt
 * @returns A colon-separated string containing the initialization vector (IV), authentication tag, and encrypted text, all in hexadecimal format
 *
 * @example
 * ```typescript
 * const encrypted = encrypt('sensitive data');
 * // Returns: "a1b2c3d4...:e5f6g7h8...:i9j0k1l2..."
 * ```
 *
 * @remarks
 * The returned encrypted string format is: `{iv}:{authTag}:{encryptedText}`
 * - IV: Hexadecimal representation of the initialization vector
 * - authTag: Hexadecimal representation of the GCM authentication tag
 * - encryptedText: Hexadecimal representation of the encrypted data
 *
 * This function uses ALGORITHM.BLOCK_CIPHER, ALGORITHM.KEY, and ALGORITHM.AUTH_TAG_BYTE_LEN for encryption configuration.
 */
export const encrypt = (text: string): string => {
	const iv = getIV()

	const cipher = createCipheriv(
		ALGORITHM.BLOCK_CIPHER,
		ALGORITHM.KEY,
		iv,
		{ authTagLength: ALGORITHM.AUTH_TAG_BYTE_LEN } as CipherGCMOptions // authTagLength is supported because we're using aes-256-gcm
	) as CipherGCM

	let encrypted = cipher.update(text, 'utf8', 'hex')
	encrypted += cipher.final('hex')

	const authTag = cipher.getAuthTag()

	return `${Buffer.from(iv).toString('hex')}:${authTag.toString('hex')}:${encrypted}`
}

/**
 * Decrypts an encrypted string that was encrypted using AES-256-GCM.
 *
 * @param encryptedData - The encrypted data in the format "iv:authTag:encryptedText" where each component is hex-encoded
 * @returns The decrypted plaintext string
 * @throws {Error} If the encrypted data format is invalid (missing iv, authTag, or encryptedText)
 * @throws {Error} If the authentication tag verification fails
 * @throws {Error} If decryption fails
 *
 * @example
 * const decrypted = decrypt('abcd1234:ef5678:encoded_ciphertext');
 */
export const decrypt = (encryptedData: string): string => {
	const [ivHex, authTagHex, encryptedText] = encryptedData.split(':')

	if (!ivHex || !authTagHex || !encryptedText) {
		throw new Error('Invalid encrypted data format')
	}

	// Wrap the Buffers in new Uint8Arrays to bypass the SharedArrayBuffer conflict
	const iv = new Uint8Array(Buffer.from(ivHex, 'hex'))
	const authTag = new Uint8Array(Buffer.from(authTagHex, 'hex'))

	const decipher = createDecipheriv(
		ALGORITHM.BLOCK_CIPHER,
		ALGORITHM.KEY,
		iv,
		{ authTagLength: ALGORITHM.AUTH_TAG_BYTE_LEN } as CipherGCMOptions
	) as DecipherGCM

	// Now this will accept the Uint8Array
	decipher.setAuthTag(authTag)

	let decrypted = decipher.update(encryptedText, 'hex', 'utf8')
	decrypted += decipher.final('utf8')

	return decrypted
}

/**
 * Generates a SHA-256 HMAC hash of the provided text.
 * @param text - The text to be hashed
 * @returns A 64-character hexadecimal string representing the SHA-256 HMAC hash
 */
export const hash = (text: string): string => {
	return createHmac('sha256', env.HASH_KEY)
		.update(text)
		.digest('hex') // Returns a 64-character string
}