import { OrchestratorRegistry } from './registry'
import type {
	IOrchestratorDispatcher,
	OrchestratorContext,
	OrchestratorDefinition,
	OrchestratorJobData
} from './types'

export class OrchestratorHandler<
	TInput = unknown,
	TState extends Record<string, unknown> = Record<string, unknown>
> {
	constructor(
		private definition: OrchestratorDefinition<TInput, TState>,
		private dispatcher: IOrchestratorDispatcher
	) {}

	async start(
		input: TInput,
		state: TState = {} as TState,
		orchestration_id: string = this.generateOrchestrationId()
	): Promise<OrchestratorContext<TInput, TState>> {
		const context = this.createContext({
			input,
			state,
			orchestration_id
		})

		if (this.definition.steps.length === 0) {
			return context
		}

		await this.dispatcher.dispatch({
			queue_name: this.definition.queue_name,
			job_data: {
				orchestration_id,
				orchestration_name: this.definition.name,
				phase: 'execute',
				step_index: 0,
				context
			}
		})

		return context
	}

	private generateOrchestrationId(): string {
		const crypto = globalThis.crypto
		if (crypto?.randomUUID !== undefined) {
			return crypto.randomUUID()
		}

		return `${Date.now()}-${Math.random().toString(16).slice(2)}`
	}

	private createContext(params: {
		input: TInput
		state: TState
		orchestration_id: string
	}): OrchestratorContext<TInput, TState> {
		return {
			orchestration_id: params.orchestration_id,
			orchestration_name: this.definition.name,
			input: params.input,
			state: params.state,
			phase: 'execute',
			current_step_index: 0,
			completed_steps: [],
			compensating_steps: []
		}
	}
}

export class OrchestratorFactory {
	static create<
		TInput = unknown,
		TState extends Record<string, unknown> = Record<string, unknown>
	>(definition: OrchestratorDefinition<TInput, TState>, dispatcher: IOrchestratorDispatcher): OrchestratorHandler<TInput, TState> {
		return new OrchestratorHandler(definition, dispatcher)
	}

	static createFromRegistry<
		TInput = unknown,
		TState extends Record<string, unknown> = Record<string, unknown>
	>(name: string, dispatcher: IOrchestratorDispatcher): OrchestratorHandler<TInput, TState> {
		return this.create(OrchestratorRegistry.get<TInput, TState>(name), dispatcher)
	}

	static createJobData<
		TInput = unknown,
		TState extends Record<string, unknown> = Record<string, unknown>
	>(definition: OrchestratorDefinition<TInput, TState>, context: OrchestratorContext<TInput, TState>, step_index: number, phase: 'execute' | 'compensate'): OrchestratorJobData<TInput, TState> {
		return {
			orchestration_id: context.orchestration_id,
			orchestration_name: definition.name,
			phase,
			step_index,
			context
		}
	}
}