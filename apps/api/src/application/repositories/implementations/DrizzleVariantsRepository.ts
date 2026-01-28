import { and, eq, inArray } from 'drizzle-orm'

import { variants } from '@integrator-packages/database/drizzle/tables'
import { DrizzleBaseRepository, drizzleClient } from '@integrator-packages/database/drizzle/client'
import { IVariant } from '@integrator-packages/database/entities'

import { ICreateManyParams, IFindManyParams, IFindManyResponse, IVariantsRepository } from '@repositories/IVariantsRepository'

export class DrizzleVariantsRepository extends DrizzleBaseRepository implements IVariantsRepository {
	async findMany({ user_id, sku }: IFindManyParams): Promise<IFindManyResponse> {
		return await this.drizzleClient.query.variants.findMany({
			columns: {
				id: true,
				sku: true
			},
			where: and(
				eq(variants.user_id, user_id),
				inArray(variants.sku, sku)
			)
		})
	}

	async createMany(data: ICreateManyParams): Promise<IVariant[]> {
		return await drizzleClient.insert(variants).values(data).returning()
	}
}