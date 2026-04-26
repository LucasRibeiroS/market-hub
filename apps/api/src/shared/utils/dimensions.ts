const toNumberOrZero = (value: string): number => {
	const numeric = Number(value)
	return Number.isFinite(numeric) ? numeric : 0
}

/**
 * Parses a dimension value (in centimeters) from a numeric string into a number.
 *
 * Uses a safe numeric conversion and returns `0` when the input is not a finite number.
 *
 * @param value - Dimension value in centimeters as a string (e.g., `"12.5"`).
 * @returns The parsed dimension as a number, or `0` if parsing fails.
 */
export const parseDimension = (value: string): number => {
	return toNumberOrZero(value)
}

/**
 * Parses a weight value (in kilograms) from a numeric string and converts it to grams.
 *
 * Uses a safe numeric conversion and returns `0` when the input is not a finite number.
 * The resulting grams value is rounded to the nearest integer.
 *
 * @param value - Weight value in kilograms as a string (e.g., `"1.250"`).
 * @returns The weight in grams as an integer, or `0` if parsing fails.
 */
export const parseWeightToGrams = (value: string): number => {
	return Math.round(toNumberOrZero(value) * 1000)
}