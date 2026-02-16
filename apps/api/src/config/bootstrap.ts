import 'dotenv/config'
import 'reflect-metadata'

import { container } from 'tsyringe'

import { schemas } from '@integrator-packages/use-case/schemas'

import { getAllSchemas } from '@utils/typebox'

import { ApiKeysRepositorySymbol } from '@repositories/IApiKeysRepository'
import { PasswordResetsRepositorySymbol } from '@repositories/IPasswordResetsRepository'
import { UsersRepositorySymbol } from '@repositories/IUsersRepository'
import { ProductsRepositorySymbol } from '@repositories/IProductsRepository'
import { VariantsRepositorySymbol } from '@repositories/IVariantsRepository'
import { DrizzleApiKeysRepository, DrizzlePasswordResetsRepository, DrizzleProductsRepository, DrizzleUsersRepository, DrizzleVariantsRepository } from '@repositories/implementations'

import { EmailAdapterSymbol } from '@adapters/IEmailAdapter'
import { SmtpEmailAdapter } from '@adapters/implementations'

// Register common schemas in the use-case layer
schemas.register(getAllSchemas())

// Register repositories dependencies
container.register(ApiKeysRepositorySymbol, DrizzleApiKeysRepository)
container.register(PasswordResetsRepositorySymbol, DrizzlePasswordResetsRepository)
container.register(UsersRepositorySymbol, DrizzleUsersRepository)
container.register(ProductsRepositorySymbol, DrizzleProductsRepository)
container.register(VariantsRepositorySymbol, DrizzleVariantsRepository)

// Register adapters dependencies
container.register(EmailAdapterSymbol, SmtpEmailAdapter)