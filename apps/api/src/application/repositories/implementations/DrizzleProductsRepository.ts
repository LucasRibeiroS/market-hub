import { eq, getTableColumns, sql } from 'drizzle-orm'

import { products, variants } from '@integrator-packages/database/drizzle/tables'
import { DrizzleBaseRepository, jsonAggBuildObject } from '@integrator-packages/database/drizzle/client'
import { IProduct } from '@integrator-packages/database/entities'

import { ICountParams, ICreateParams, IFindByIdResponse, IFindManyParams, IFindManyResponse, IProductsRepository } from '@repositories/IProductsRepository'

export class DrizzleProductsRepository extends DrizzleBaseRepository implements IProductsRepository {
	private findByIdQuery = this.drizzleClient.query.products
		.findFirst({
			columns: {
				id: true,
				user_id: true
			},
			where: eq(products.id, sql.placeholder('id'))
		})
		.prepare('findProductById')

	async findMany({ user_id, ...paginator }: IFindManyParams): Promise<IFindManyResponse> {
		const variantsSq = this.drizzleClient
			.select({
				data: jsonAggBuildObject(getTableColumns(variants)).as('variant_data')
			})
			.from(variants)
			.where(eq(variants.product_id, products.id))
			.as('variants_sq')

		return await this.paginatedQuery({
			query: this.drizzleClient
				.select({
					...getTableColumns(products),
					variants: variantsSq.data
				})
				.from(products)
				.leftJoinLateral(variantsSq, sql`true`)
				.where(eq(products.user_id, user_id))
				.$dynamic(),
			counter: this.count({ user_id }),
			paginator
		})
	}

	async findById(id: string): Promise<IFindByIdResponse | null> {
		return await this.findByIdQuery.execute({ id }) || null
	}

	async count({ user_id }: ICountParams): Promise<number> {
		return await this.drizzleClient.$count(products, eq(products.user_id, user_id))
	}

	async create(data: ICreateParams): Promise<IProduct> {
		return await this.drizzleClient
			.insert(products)
			.values(data)
			.returning()
			.then(([product]) => product)
	}
}