import { container } from 'tsyringe'
import { Job, Processor } from 'bullmq'

import { UseCaseFactory } from '@integrator-packages/use-case'
import {
	IOrchestratorDispatcher,
	OrchestratorContext,
	OrchestratorDefinition,
	OrchestratorDispatcherSymbol,
	OrchestratorExecutionResult,
	OrchestratorJobData,
	OrchestratorRegistry,
	OrchestratorStepDefinition
} from '@integrator-packages/use-case/orchestrator'

import { isHttpException } from '@integrator-packages/use-case/exceptions'

type OrchestratorJob = Job<OrchestratorJobData, unknown, string>

export class OrchestratorProcessor {
	private readonly dispatcher: IOrchestratorDispatcher = container.resolve(OrchestratorDispatcherSymbol)

	apply(): Processor<unknown, unknown, string> {
		return async(job) => {
			const orchestratorJob = job as OrchestratorJob
			const data = orchestratorJob.data
			const definition = OrchestratorRegistry.get(data.orchestration_name)

			if (data.phase === 'execute') {
				return await this.executeStep(definition, data)
			}

			return await this.compensateStep(definition, data)
		}
	}

	private async executeStep(definition: OrchestratorDefinition, data: OrchestratorJobData): Promise<OrchestratorExecutionResult> {
		const step = definition.steps[data.step_index]
		if (step === undefined) {
			return {
				status: 'completed',
				context: data.context
			}
		}

		const started_at = new Date().toISOString()
		const context = this.withExecutionContext(data.context, data.step_index)

		try {
			const response = await this.handleStep(step, context)

			if (response.process === 'failed') {
				const failedContext = this.withFailedStep(context, step.name, response.body)
				await this.enqueueRollback(definition, failedContext, data.step_index)

				return {
					status: data.step_index > 0 ? 'compensating' : 'failed',
					context: failedContext
				}
			}

			const merged_state = step.merge_state_on_success?.(context, response.body) ?? {}
			const nextContext = this.withCompletedStep(context, step.name, started_at, merged_state, response.body)

			if (data.step_index + 1 < definition.steps.length) {
				await this.dispatcher.dispatch({
					queue_name: definition.queue_name,
					job_data: {
						orchestration_id: nextContext.orchestration_id,
						orchestration_name: nextContext.orchestration_name,
						phase: 'execute',
						step_index: data.step_index + 1,
						context: nextContext
					}
				})

				return {
					status: 'running',
					context: nextContext
				}
			}

			return {
				status: 'completed',
				context: nextContext
			}
		} catch(error) {
			const failedContext = this.withFailedStep(context, step.name, this.getErrorMessage(error))
			await this.enqueueRollback(definition, failedContext, data.step_index)

			return {
				status: data.step_index > 0 ? 'compensating' : 'failed',
				context: failedContext
			}
		}
	}

	private async compensateStep(definition: OrchestratorDefinition, data: OrchestratorJobData): Promise<OrchestratorExecutionResult> {
		const step = definition.steps[data.step_index]
		if (step === undefined) {
			return {
				status: 'compensated',
				context: data.context
			}
		}

		const started_at = new Date().toISOString()
		const context = this.withCompensationContext(data.context, data.step_index)

		if (step.compensate_use_case !== undefined) {
			const compensationInput = step.build_compensation_input?.(context, context.last_result)
			if (compensationInput !== undefined) {
				const response = await UseCaseFactory.create(container.resolve(step.compensate_use_case) as any).handle(compensationInput)
				if (response.process === 'failed') {
					throw new Error(response.body)
				}
			}
		}

		const merged_state = step.merge_state_on_compensation?.(context, context.last_result) ?? {}
		const nextContext = this.withCompensatedStep(context, step.name, started_at, merged_state)

		if (data.step_index > 0) {
			await this.dispatcher.dispatch({
				queue_name: definition.queue_name,
				job_data: {
					orchestration_id: nextContext.orchestration_id,
					orchestration_name: nextContext.orchestration_name,
					phase: 'compensate',
					step_index: data.step_index - 1,
					context: nextContext
				}
			})

			return {
				status: 'compensating',
				context: nextContext
			}
		}

		return {
			status: 'compensated',
			context: nextContext
		}
	}

	private async enqueueRollback(definition: OrchestratorDefinition, context: OrchestratorContext, step_index: number): Promise<void> {
		if (step_index === 0) {
			return
		}

		await this.dispatcher.dispatch({
			queue_name: definition.queue_name,
			job_data: {
				orchestration_id: context.orchestration_id,
				orchestration_name: context.orchestration_name,
				phase: 'compensate',
				step_index: step_index - 1,
				context
			}
		})
	}

	private async handleStep(step: OrchestratorStepDefinition, context: OrchestratorContext) {
		const useCase = UseCaseFactory.create(container.resolve(step.use_case) as any)
		return await useCase.handle(step.build_input(context))
	}

	private withExecutionContext(context: OrchestratorContext, current_step_index: number): OrchestratorContext {
		return {
			...context,
			phase: 'execute',
			current_step_index,
			last_error: undefined,
			last_result: undefined
		}
	}

	private withFailedStep(context: OrchestratorContext, stepName: string, error: string): OrchestratorContext {
		const item = {
			name: stepName,
			status: 'failed' as const,
			started_at: new Date().toISOString(),
			finished_at: new Date().toISOString(),
			error
		}

		return {
			...context,
			last_error: error,
			failed_step: stepName,
			completed_steps: [...context.completed_steps, item]
		}
	}

	private withCompletedStep(context: OrchestratorContext, stepName: string, started_at: string, merged_state: Record<string, unknown>, result: unknown): OrchestratorContext {
		return {
			...context,
			state: {
				...context.state,
				...merged_state
			},
			last_result: result,
			current_step_index: context.current_step_index + 1,
			completed_steps: [...context.completed_steps, {
				name: stepName,
				status: 'completed',
				started_at,
				finished_at: new Date().toISOString()
			}]
		}
	}

	private withCompensationContext(context: OrchestratorContext, current_step_index: number): OrchestratorContext {
		return {
			...context,
			phase: 'compensate',
			current_step_index
		}
	}

	private withCompensatedStep(context: OrchestratorContext, stepName: string, started_at: string, merged_state: Record<string, unknown>): OrchestratorContext {
		return {
			...context,
			state: {
				...context.state,
				...merged_state
			},
			compensating_steps: [...context.compensating_steps, {
				name: stepName,
				status: 'compensated',
				started_at,
				finished_at: new Date().toISOString()
			}]
		}
	}

	private getErrorMessage(error: unknown): string {
		if (isHttpException(error)) {
			return error.body
		}

		if (error instanceof Error) {
			return error.message
		}

		return 'Unknown orchestrator error'
	}
}