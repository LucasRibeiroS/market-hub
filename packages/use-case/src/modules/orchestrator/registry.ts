import type { OrchestratorDefinition } from './types'

export class OrchestratorRegistry {
	private static readonly definitions = new Map<string, OrchestratorDefinition<any, any>>()

	static register<
		TInput = unknown,
		TState extends Record<string, unknown> = Record<string, unknown>
	>(definition: OrchestratorDefinition<TInput, TState>): OrchestratorDefinition<TInput, TState> {
		if (this.definitions.has(definition.name)) {
			throw new Error(`Orchestrator ${definition.name} already registered`)
		}

		this.definitions.set(definition.name, definition)
		return definition
	}

	static get<
		TInput = unknown,
		TState extends Record<string, unknown> = Record<string, unknown>
	>(name: string): OrchestratorDefinition<TInput, TState> {
		const definition = this.definitions.get(name)
		if (!definition) {
			throw new Error(`Orchestrator ${name} not found`)
		}

		return definition as OrchestratorDefinition<TInput, TState>
	}

	static list(): OrchestratorDefinition<any, any>[] {
		return [...this.definitions.values()]
	}

	static clear(): void {
		this.definitions.clear()
	}
}

export const defineOrchestrator = <
	TInput = unknown,
	TState extends Record<string, unknown> = Record<string, unknown>
>(definition: OrchestratorDefinition<TInput, TState>): OrchestratorDefinition<TInput, TState> => {
	return OrchestratorRegistry.register(definition)
}