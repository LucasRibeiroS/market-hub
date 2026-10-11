import 'dotenv/config'
import 'reflect-metadata'

import { container } from 'tsyringe'

import { schemas } from '@integrator-packages/use-case/schemas'

import { getAllSchemas } from '@utils/typebox'

import { EmailAdapterSymbol } from '@adapters/IEmailAdapter'
import { FileLoggerAdapter, LoggerAdapterSymbol } from '@integrator-packages/adapters/logger'
import { CacheAdapterSymbol, RedisCacheAdapter } from '@integrator-packages/adapters/cache'
import { MarketplaceAdapterSymbol } from '@adapters/IMarketplaceAdapter'
import { QueueAdapterSymbol } from '@adapters/IQueueAadpter'
import { BullMQQueueAdapter, MagaluAdapter, MercadoLivreAdapter, SmtpEmailAdapter } from '@adapters/implementations'

import { MarketplaceAdapterFactorySymbol } from '@factories/IMarketplaceAdapterFactory'
import { MarketplaceAdapterFactory } from '@factories/implementations'

import { ApiKeysRepositorySymbol } from '@repositories/IApiKeysRepository'
import { MarketplaceAccountsRepositorySymbol } from '@repositories/IMarketplaceAccountsRepository'
import { MarketplaceCredentialsRepositorySymbol } from '@repositories/IMarketplaceCredentialsRepository'
import { MarketplaceListingsRepositorySymbol } from '@repositories/IMarketplaceListingsRepository'
import { MarketplaceProvidersRepositorySymbol } from '@repositories/IMarketplaceProvidersRepository'
import { MarketplaceWebhooksRepositorySymbol } from '@repositories/IMarketplaceWebhooksRepository'
import { OrdersRepositorySymbol } from '@repositories/IOrdersRepository'
import { OrderItemsRepositorySymbol } from '@repositories/IOrderItemsRepository'
import { OrderShipmentsRepositorySymbol } from '@repositories/IOrderShipmentsRepository'
import { OrderInvoicesRepositorySymbol } from '@repositories/IOrderInvoicesRepository'
import { PasswordResetsRepositorySymbol } from '@repositories/IPasswordResetsRepository'
import { UsersRepositorySymbol } from '@repositories/IUsersRepository'
import { ProductsRepositorySymbol } from '@repositories/IProductsRepository'
import { VariantsRepositorySymbol } from '@repositories/IVariantsRepository'

import {
	DrizzleApiKeysRepository,
	DrizzleMarketplaceAccountsRepository,
	DrizzleMarketplaceCredentialsRepository,
	DrizzleMarketplaceListingsRepository,
	DrizzleMarketplaceProvidersRepository,
	DrizzleMarketplaceWebhooksRepository,
	DrizzleOrderInvoicesRepository,
	DrizzleOrderItemsRepository,
	DrizzleOrderShipmentsRepository,
	DrizzleOrdersRepository,
	DrizzlePasswordResetsRepository,
	DrizzleProductsRepository,
	DrizzleUsersRepository,
	DrizzleVariantsRepository
} from '@repositories/implementations'

import { DeleteMarketplaceWebhook, DeleteMarketplaceWebhookSymbol, UpsertMarketplaceWebhook, UpsertMarketplaceWebhookSymbol } from '@use-cases/marketplace-webhooks'
import { DeleteOrder, DeleteOrderSymbol, UpsertOrder, UpsertOrderSymbol } from '@use-cases/orders'

// Register common schemas in the use-case layer
schemas.register(getAllSchemas())

// Register adapters dependencies
container.register(CacheAdapterSymbol, RedisCacheAdapter)
container.register(EmailAdapterSymbol, SmtpEmailAdapter)
container.register(LoggerAdapterSymbol, FileLoggerAdapter)
container.register(MarketplaceAdapterSymbol, MagaluAdapter)
container.register(MarketplaceAdapterSymbol, MercadoLivreAdapter)
container.register(QueueAdapterSymbol, BullMQQueueAdapter)

// Register factories
container.register(MarketplaceAdapterFactorySymbol, MarketplaceAdapterFactory)

// Register repositories dependencies
container.register(ApiKeysRepositorySymbol, DrizzleApiKeysRepository)
container.register(MarketplaceAccountsRepositorySymbol, DrizzleMarketplaceAccountsRepository)
container.register(MarketplaceCredentialsRepositorySymbol, DrizzleMarketplaceCredentialsRepository)
container.register(MarketplaceListingsRepositorySymbol, DrizzleMarketplaceListingsRepository)
container.register(MarketplaceProvidersRepositorySymbol, DrizzleMarketplaceProvidersRepository)
container.register(MarketplaceWebhooksRepositorySymbol, DrizzleMarketplaceWebhooksRepository)
container.register(OrdersRepositorySymbol, DrizzleOrdersRepository)
container.register(OrderItemsRepositorySymbol, DrizzleOrderItemsRepository)
container.register(OrderShipmentsRepositorySymbol, DrizzleOrderShipmentsRepository)
container.register(OrderInvoicesRepositorySymbol, DrizzleOrderInvoicesRepository)
container.register(PasswordResetsRepositorySymbol, DrizzlePasswordResetsRepository)
container.register(UsersRepositorySymbol, DrizzleUsersRepository)
container.register(ProductsRepositorySymbol, DrizzleProductsRepository)
container.register(VariantsRepositorySymbol, DrizzleVariantsRepository)

// Register use-cases dependencies
container.register(UpsertMarketplaceWebhookSymbol, {
	useFactory: c => c.resolve(UpsertMarketplaceWebhook)
})
container.register(DeleteMarketplaceWebhookSymbol, {
	useFactory: c => c.resolve(DeleteMarketplaceWebhook)
})
container.register(UpsertOrderSymbol, {
	useFactory: c => c.resolve(UpsertOrder)
})
container.register(DeleteOrderSymbol, {
	useFactory: c => c.resolve(DeleteOrder)
})