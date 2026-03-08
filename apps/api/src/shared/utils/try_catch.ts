/**
 * Executes an asynchronous function and returns a tuple containing either the result or an error.
 *
 * @template T - The type of the resolved value from the provided function.
 * @param fn - An asynchronous function that returns a Promise of type T.
 * @returns A Promise that resolves to a tuple:
 *   - The first element is an Error if the function throws, otherwise null.
 *   - The second element is the result of the function if successful, otherwise null.
 *
 * @example
 * const [error, data] = await tryCatch(() => fetchData());
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
		return [null, error]
	}
}