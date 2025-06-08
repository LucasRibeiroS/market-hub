export type CustomOmit<T, U extends keyof T> = {
	[K in keyof T as K extends U ? never : K]: T[K]
}

export type ExcludeStrict<T, U extends T> = Exclude<T, U>

export type ExtractStrict<T, U extends T> = Extract<T, U>

export type Require<T, U extends keyof T> = { [P in U]-?: T[P] } & T

export type Nullable<T> = T | null

export type EmptyObject = Record<string, never>

export type UnknownObject = Record<string, unknown>

export type SetDateAsString<T, K extends keyof T> = {
	[P in K]: T[P] extends Date ? string : T[P]
} & Omit<T, K>

// Function used to assert that two types extend each other at compile time
export const assertTypes = <T1, _T2 extends T1>() => {}