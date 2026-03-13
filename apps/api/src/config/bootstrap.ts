import 'dotenv/config'
import 'reflect-metadata'

import { container } from 'tsyringe'

import { schemas } from '@integrator-packages/use-case/schemas'

import { getAllSchemas } from '@utils/typebox'

import { EmailAdapterSymbol } from '@adapters/IEmailAdapter'
import { ConsoleLoggerAdapter, LoggerAdapterSymbol } from '@integrator-packages/adapters/logger'
import { MarketplaceAdapterSymbol } from '@adapters/IMarketplaceAdapter'
import { QueueAdapterSymbol } from '@adapters/IQueueAadpter'
import { BullMQQueueAdapter, MagaluAdapter, MercadoLivreAdapter, SmtpEmailAdapter } from '@adapters/implementations'

import { MarketplaceAdapterFactorySymbol } from '@factories/IMarketplaceAdapterFactory'
import { MarketplaceAdapterFactory } from '@factories/implementations'

import { ApiKeysRepositorySymbol } from '@repositories/IApiKeysRepository'
import { MarketplaceAccountsRepositorySymbol } from '@repositories/IMarketplaceAccountsRepository'
import { MarketplaceCredentialsRepositorySymbol } from '@repositories/IMarketplaceCredentialsRepository'
import { MarketplaceProvidersRepositorySymbol } from '@repositories/IMarketplaceProvidersRepository'
import { PasswordResetsRepositorySymbol } from '@repositories/IPasswordResetsRepository'
import { UsersRepositorySymbol } from '@repositories/IUsersRepository'
import { ProductsRepositorySymbol } from '@repositories/IProductsRepository'
import { VariantsRepositorySymbol } from '@repositories/IVariantsRepository'

import {
	DrizzleApiKeysRepository,
	DrizzleMarketplaceAccountsRepository,
	DrizzleMarketplaceCredentialsRepository,
	DrizzleMarketplaceProvidersRepository,
	DrizzlePasswordResetsRepository,
	DrizzleProductsRepository,
	DrizzleUsersRepository,
	DrizzleVariantsRepository
} from '@repositories/implementations'

// Register common schemas in the use-case layer
schemas.register(getAllSchemas())

// Register adapters dependencies
container.register(EmailAdapterSymbol, SmtpEmailAdapter)
container.register(LoggerAdapterSymbol, ConsoleLoggerAdapter)
container.register(MarketplaceAdapterSymbol, MagaluAdapter)
container.register(MarketplaceAdapterSymbol, MercadoLivreAdapter)
container.register(QueueAdapterSymbol, BullMQQueueAdapter)

// Register factories
container.register(MarketplaceAdapterFactorySymbol, MarketplaceAdapterFactory)

// Register repositories dependencies
container.register(ApiKeysRepositorySymbol, DrizzleApiKeysRepository)
container.register(MarketplaceAccountsRepositorySymbol, DrizzleMarketplaceAccountsRepository)
container.register(MarketplaceCredentialsRepositorySymbol, DrizzleMarketplaceCredentialsRepository)
container.register(MarketplaceProvidersRepositorySymbol, DrizzleMarketplaceProvidersRepository)
container.register(PasswordResetsRepositorySymbol, DrizzlePasswordResetsRepository)
container.register(UsersRepositorySymbol, DrizzleUsersRepository)
container.register(ProductsRepositorySymbol, DrizzleProductsRepository)
container.register(VariantsRepositorySymbol, DrizzleVariantsRepository)
