import { IValidator } from '@modules/validator/types'

export const ValidatorMetadataKeys = {
	VALIDATE_WITH: 'validate_with'
} as const

export type ValidatorMetadataType<T> = {
	[ValidatorMetadataKeys.VALIDATE_WITH]: () => new () => IValidator<T>
}