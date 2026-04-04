import { and, eq, inArray, SQL } from 'drizzle-orm'

import { variants } from '@integrator-packages/database/drizzle/tables'
import { DrizzleBaseRepository } from '@integrator-packages/database/drizzle/client'
import { IVariant } from '@integrator-packages/database/entities'

import { ICreateManyParams, IDeleteManyParams, IFindFirstParams, IFindManyParams, IFindManyResponse, IUpdateManyParams, IUpdateParams, IVariantsRepository } from '@repositories/IVariantsRepository'

export class DrizzleVariantsRepository extends DrizzleBaseRepository implements IVariantsRepository {
	async findMany({ user_id, product_id, sku }: IFindManyParams): Promise<IFindManyResponse> {
		return await this.drizzleClient.query.variants.findMany({
			columns: {
				id: true,
				sku: true
			},
			where: and(
				eq(variants.user_id, user_id),
				inArray(variants.sku, sku),
				product_id ? eq(variants.product_id, product_id) : undefined
			)
		})
	}

	async findFirst({ user_id, sku, is_primary }: IFindFirstParams): Promise<IVariant | null> {
		const where: SQL[] = [eq(variants.user_id, user_id)]
		if (sku !== undefined) {
			where.push(eq(variants.sku, sku))
		}
		if (is_primary !== undefined) {
			where.push(eq(variants.is_primary, is_primary))
		}

		return await this.drizzleClient.query.variants.findFirst({
			where: and(...where)
		}) || null
	}

	async createMany(data: ICreateManyParams): Promise<IVariant[]> {
		return await this.drizzleClient.insert(variants).values(data).returning()
	}

	async update(id: string, data: IUpdateParams): Promise<void> {
		await this.drizzleClient
			.update(variants)
			.set(data)
			.where(eq(variants.id, id))
	}

	async updateMany(product_id: string, data: IUpdateManyParams): Promise<void> {
		await this.drizzleClient
			.update(variants)
			.set(data)
			.where(eq(variants.product_id, product_id))
	}

	async deleteMany({ id }: IDeleteManyParams): Promise<void> {
		await this.drizzleClient.delete(variants).where(inArray(variants.id, id))
	}
}