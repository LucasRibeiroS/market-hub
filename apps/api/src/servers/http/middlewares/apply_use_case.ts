import { FastifyReply, FastifyRequest } from 'fastify'

import { IWrappedUseCase } from '@integrator-packages/use-case'

import { GenericRequest } from '@http/utils/types'

declare module 'fastify' {
	export interface FastifyReply {
		error?: {
			message: string
		}
	}
}

export type IApplyUseCaseOptions = Partial<{
	separate_request_data: boolean
	map_params: (params: Record<string, unknown>) => Record<string, unknown>
}>

export const applyUseCase = (
	useCase: IWrappedUseCase<unknown, unknown>,
	{ separate_request_data, map_params }: IApplyUseCaseOptions = {}
) => async(req: FastifyRequest<GenericRequest>, res: FastifyReply) => {
	let data = { ...req.query, ...req.body }

	if (req.user?.id !== undefined) {
		data.user_id = req.user.id
	}

	if (separate_request_data) {
		const { user_id, ...body } = data
		data = {
			user_id,
			data: body
		}
	}

	if (map_params !== undefined) {
		data = { ...data, ...map_params(req.params) }
	} else {
		data = { ...data, ...req.params }
	}

	const { status_code, process, body } = await useCase.handle(data)

	if (status_code >= 400 && typeof body === 'string') {
		// Set explicity error message to use in the logger
		res.error = { message: body }
	}

	return res.status(status_code).send({ process, body })
}
