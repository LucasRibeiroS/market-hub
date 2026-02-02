import { SchemaOptions, TSchema, TString, Type } from '@sinclair/typebox'

// Define a custom typeS
type DateTypeOptions = {
	readOnly?: boolean
}
/**
 * Creates a TypeBox string schema definition formatted as a date-time.
 *
 * This utility function wraps `Type.String` with the 'date-time' format,
 * suitable for validating ISO 8601 date strings.
 *
 * @param options - Optional configuration object to customize the string schema (e.g., description, examples).
 * @returns A TypeBox TString schema configured with format 'date-time'.
 */
export const DateType = (options?: DateTypeOptions) => Type.String({
	...options,
	format: 'date-time'
})

/**
 * The usage of Type.Union(T, Type.Null()) may differ from Type.Union([Type.Null(), T]).
 * The former represents the desired behavior, and this utility function ensures that
 */
export const TNullable = <T extends TSchema>(T: T) => {
	return Type.Union([Type.Null(), T])
}

/**
 * Creates a TypeBox Union schema from a TypeScript enum-like object (Record<string, string>).
 * This utility helps in defining schemas that validate against the values of a given object or enum,
 * optionally attaching descriptions and titles to each enum variant.
 *
 * @param enumObj - The source object or enum containing the valid string values.
 * @param descriptions - An optional mapping of enum keys to description strings. If provided,
 *                      these descriptions and the key names (as titles) are attached to the
 *                      corresponding literal schemas in the union.
 * @returns A TypeBox Union schema (`Type.Union`) composed of `Type.Literal` schemas for each value in the enum.
 *          If descriptions are provided, the literals will include metadata.
 *
 * @example
 * ```typescript
 * enum Colors {
 *   Red = "red",
 *   Blue = "blue"
 * }
 *
 * // Basic usage
 * const ColorSchema = TEnumObject(Colors);
 *
 * // Usage with descriptions
 * const AnnotatedColorSchema = TEnumObject(Colors, {
 *   Red: "The color of fire",
 *   Blue: "The color of the sky"
 * });
 * ```
 */
export const TEnumObject = <T extends Record<string, string>>(
	enumObj: T,
	descriptions?: Partial<Record<keyof T, string>>
) => {
	const values = Object.values(enumObj) as [T[keyof T], ...T[keyof T][]]
	return Type.Union(
		values.map(value => {
			if (!descriptions) {
				return Type.Literal(value)
			}
			const key = Object.keys(enumObj).find(k => enumObj[k] === value) as keyof T
			const description = descriptions[key]
			return description ? Type.Literal(value, { description, title: key as string }) : Type.Literal(value)
		})
	)
}

type NumericOptions = {
	precision?: number
	scale?: number
	minimum?: number
	maximum?: number
} & SchemaOptions

/**
 * Creates a TypeBox schema for PostgreSQL numeric type.
 * Validates as string to preserve precision, but accepts numbers in input.
 *
 * @param options - Configuration options
 * @param options.precision - Total number of digits (default: 10)
 * @param options.scale - Number of decimal places (default: 2)
 * @param options.minimum - Minimum value (optional)
 * @param options.maximum - Maximum value (optional)
 *
 * @example
 * ```typescript
 * // For weight: numeric(10, 3)
 * TNumeric({ precision: 10, scale: 3, minimum: 0.001 })
 *
 * // For dimensions: numeric(10, 2)
 * TNumeric({ precision: 10, scale: 2, minimum: 0.1 })
 * ```
 */
export const TNumeric = (options: NumericOptions = {}): TString => {
	const {
		precision = 10,
		scale = 2,
		minimum,
		maximum,
		...schemaOptions
	} = options

	// Calculate max integer digits
	const integerDigits = precision - scale

	// Build regex pattern: optional sign, integer part, optional decimal part
	// Example for scale=2: ^\d{1,8}(\.\d{1,2})?$
	const pattern = scale > 0
		? `^\\d{1,${integerDigits}}(\\.\\d{1,${scale}})?$`
		: `^\\d{1,${precision}}$`

	return Type.String({
		pattern,
		...schemaOptions,
		description: `Numeric value with up to ${precision} total digits and ${scale} decimal places${minimum !== undefined ? `, minimum: ${minimum}` : ''}${maximum !== undefined ? `, maximum: ${maximum}` : ''}`
	})
}