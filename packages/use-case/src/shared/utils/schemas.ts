import { TSchema } from '@sinclair/typebox'

import { ajv } from '@clients/ajv'

export const schemas = {
	register: (schemas: TSchema[]) => {
		ajv.addSchema(schemas)
	}
}