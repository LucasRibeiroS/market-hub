import type { IUseCase } from '../../index'

export type OrchestratorPhase = 'execute' | 'compensate'

export type OrchestratorStepStatus = 'pending' | 'running' | 'completed' | 'compensating' | 'compensated' | 'failed'

export type OrchestratorStepHistoryItem = {
	name: string
	status: OrchestratorStepStatus
	started_at: string
	finished_at?: string
	error?: string
}

export type OrchestratorContext<
	TInput = unknown,
	TState extends Record<string, unknown> = Record<string, unknown>
> = {
	orchestration_id: string
	orchestration_name: string
	input: TInput
	state: TState
	phase: OrchestratorPhase
	current_step_index: number
	completed_steps: OrchestratorStepHistoryItem[]
	compensating_steps: OrchestratorStepHistoryItem[]
	failed_step?: string
	last_result?: unknown
	last_error?: string
}

export type OrchestratorStepDefinition<
	TInput = unknown,
	TState extends Record<string, unknown> = Record<string, unknown>,
	TStepInput = unknown,
	TStepOutput = unknown,
	TRollbackInput = unknown
> = {
	name: string
	use_case: new (...args: any[]) => IUseCase<TStepInput, TStepOutput>
	compensate_use_case?: new (...args: any[]) => IUseCase<TRollbackInput, unknown>
	build_input: (context: OrchestratorContext<TInput, TState>) => TStepInput
	build_compensation_input?: (context: OrchestratorContext<TInput, TState>, step_result: TStepOutput) => TRollbackInput
	merge_state_on_success?: (context: OrchestratorContext<TInput, TState>, step_result: TStepOutput) => Partial<TState> | void
	merge_state_on_compensation?: (context: OrchestratorContext<TInput, TState>, step_result: TStepOutput) => Partial<TState> | void
}

export type OrchestratorDefinition<
	TInput = unknown,
	TState extends Record<string, unknown> = Record<string, unknown>
> = {
	name: string
	queue_name: string
	steps: Array<OrchestratorStepDefinition<TInput, TState>>
}

export type OrchestratorJobData<
	TInput = unknown,
	TState extends Record<string, unknown> = Record<string, unknown>
> = {
	orchestration_id: string
	orchestration_name: string
	phase: OrchestratorPhase
	step_index: number
	context: OrchestratorContext<TInput, TState>
}

export type OrchestratorExecutionResult<
	TInput = unknown,
	TState extends Record<string, unknown> = Record<string, unknown>
> = {
	status: 'running' | 'completed' | 'compensating' | 'compensated' | 'failed'
	context: OrchestratorContext<TInput, TState>
}

export type OrchestratorDispatchParams<
	TInput = unknown,
	TState extends Record<string, unknown> = Record<string, unknown>
> = {
	queue_name: string
	job_data: OrchestratorJobData<TInput, TState>
}

export interface IOrchestratorDispatcher {
	dispatch<
		TInput = unknown,
		TState extends Record<string, unknown> = Record<string, unknown>
	>(params: OrchestratorDispatchParams<TInput, TState>): Promise<void>
}

export const OrchestratorDispatcherSymbol = Symbol('IOrchestratorDispatcher')