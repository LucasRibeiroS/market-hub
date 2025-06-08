import type { FastifyReply, FastifyRequest } from 'fastify'
import { UnknownObject } from '@utils/types'

export type GenericRequest = {
	Querystring: UnknownObject
	Params: UnknownObject
	Body: UnknownObject
}

export type GenericMiddleware = (
	req: FastifyRequest<GenericRequest>, res: FastifyReply
) => Promise<void>