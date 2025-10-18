import 'dotenv/config'
import 'reflect-metadata'

import { container } from 'tsyringe'

import { ApiKeysRepositorySymbol } from '@repositories/IApiKeysRepository'
import { PasswordResetsRepositorySymbol } from '@repositories/IPasswordResetsRepository'
import { UsersRepositorySymbol } from '@repositories/IUsersRepository'
import { DrizzleApiKeysRepository, DrizzlePasswordResetsRepository, DrizzleUsersRepository } from '@repositories/implementations'

import { EmailAdapterSymbol } from '@adapters/IEmailAdapter'
import { SmtpEmailAdapter } from '@adapters/implementations'

// Register repositories dependencies
container.register(ApiKeysRepositorySymbol, DrizzleApiKeysRepository)
container.register(PasswordResetsRepositorySymbol, DrizzlePasswordResetsRepository)
container.register(UsersRepositorySymbol, DrizzleUsersRepository)

// Register adapters dependencies
container.register(EmailAdapterSymbol, SmtpEmailAdapter)