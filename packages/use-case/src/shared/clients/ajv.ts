import Ajv, { ErrorObject } from 'ajv'
import ajvFormats from 'ajv-formats'

export const ajv = new Ajv({
	removeAdditional: 'all',
	coerceTypes: 'array',
	useDefaults: true
})

ajvFormats(ajv)

export const formatValidationError = (
	errors: ErrorObject<string, Record<string, unknown>, unknown>[] | null | undefined
) => {
	if (errors?.at(0) == null) {
		return 'Bad request'
	}

	const field = errors[0].instancePath.replace('/', '')
	const message = errors[0].message
	return `${field || ''} ${message}`.trim()
}