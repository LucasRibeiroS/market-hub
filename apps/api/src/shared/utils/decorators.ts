import 'reflect-metadata'

import { IValidator } from '@utils/validator'
import { IDocumentation } from '@utils/documentation'

export const MetadataKeys = {
	VALIDATE_WITH: 'validate_with',
	DOCUMENTATION: 'documentation'
} as const

type MetadataKeys = typeof MetadataKeys[keyof typeof MetadataKeys]

type MetadataType<T> = {
	[MetadataKeys.VALIDATE_WITH]: () => new () => IValidator<T>
	[MetadataKeys.DOCUMENTATION]: IDocumentation
}

export const getMetadata = <K extends MetadataKeys>(
	key: K
): <T>(target: object) => MetadataType<T>[K] | undefined => {
	return (target: object) => Reflect.getMetadata(key, target)
}