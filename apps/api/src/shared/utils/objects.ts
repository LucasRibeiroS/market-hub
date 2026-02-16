import { CustomOmit } from '@utils/types'

/**
 * Omits specified keys from an object and returns a new object without those keys.
 * @template T - The type of the object
 * @template U - The keys to omit from the object
 * @param obj - The object to omit keys from
 * @param keys - An array of keys to omit from the object
 * @returns A new object with the specified keys removed
 */
export const omitKeys = <T extends object, U extends keyof T>(
	obj: T,
	keys: U[]
): CustomOmit<T, U> => {
	return Object.keys(obj)
		.filter((key) => !keys.includes(key as U))
		.reduce((acc, key) => ({
			...acc,
			[key]: obj[key as U]
		}), {} as CustomOmit<T, U>)
}