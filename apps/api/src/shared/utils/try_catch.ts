/**
 * Executes an asynchronous function and returns a tuple containing either the result or an error.
 *
 * @template T - The type of the resolved value from the provided function.
 * @param fn - An asynchronous function that returns a Promise of type T.
 * @returns A Promise that resolves to a tuple:
 *   - The first element is the result of the function if successful, otherwise null.
 *   - The second element is an Error if the function throws, otherwise null.
 *
 * @example
 * const [data, error] = await tryCatch(() => fetchData());
 * if (error) {
 *   // handle error
 * } else {
 *   // use data
 * }
 */
export type TryCatchResult<T> = [T, null] | [null, Error]
export const tryCatch = async <T>(fn: () => Promise<T>): Promise<TryCatchResult<T>> => {
	try {
		const result = await fn()
		return [result, null]
	} catch(error) {
		return [null, error as Error]
	}
}

/**
 * Parses a JSON string and returns a tuple with either the parsed value or an error.
 *
 * @template T - The expected type of the parsed JSON payload.
 * @param raw - Raw JSON string to parse.
 * @returns A tuple in the format [parsed, null] on success or [null, error] on failure.
 *
 * @example
 * const [payload, parseError] = tryParseJson<{ id: string }>(rawBody)
 * if (parseError) {
 *   // handle malformed JSON
 * }
 */
export type TryParseJsonResult<T> = [T, null] | [null, Error]
export const tryParseJson = <T>(raw: string): TryParseJsonResult<T> => {
	try {
		const parsed = JSON.parse(raw) as T
		return [parsed, null]
	} catch(error) {
		return [null, error as Error]
	}
}