import { container } from 'tsyringe'

import { UseCaseFactory } from '@integrator-packages/use-case'

import { GetUser } from './GetUser'

export const getUser = UseCaseFactory.create(container.resolve(GetUser))