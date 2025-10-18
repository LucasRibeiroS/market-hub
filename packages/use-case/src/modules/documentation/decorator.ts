import { IDocumentation } from '@modules/documentation/types'

export const DocumentationMetadataKeys = {
	DOCUMENTATION: 'documentation'
} as const

export type DocumentationMetadataType = {
	[DocumentationMetadataKeys.DOCUMENTATION]: IDocumentation
}