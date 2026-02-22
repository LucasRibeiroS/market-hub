import { BehaviorSubject, lastValueFrom, map, Observable, tap } from 'rxjs'

import { Injectable } from '@angular/core'
import { HttpClient, HttpContext } from '@angular/common/http'
import { Router } from '@angular/router'

import { environment } from '@env/environment'

import { IGNORED_ERRORS } from '@core/api/api-error.interceptor'
import {
	ICreatePasswordResetRequest,
	IResetPasswordRequest,
	ISignInRequest,
	ISignInResponse,
	ISignUpRequest,
	ISignUpResponse,
	IUser
} from '@core/auth/models'

@Injectable({ providedIn: 'root' })
export class AuthService {
	private readonly apiUrl = `${environment.apiUrl}`

	// Using a BehaviorSubject to hold the current user state. Components can subscribe to currentUser$ to get updates.
	private currentUserSubject = new BehaviorSubject<IUser | null>(null)

	// Convenience Observable for components to subscribe to. They will get updates whenever the user state changes.
	public currentUser$ = this.currentUserSubject.asObservable()

	private readonly IS_AUTHENTICATED_COOKIE_NAME = '@integrator:is-authenticated'

	constructor(
		private http: HttpClient,
		private router: Router
	) {}

	/**
	 * Initializes the user session on app startup.
	 */
	async init(): Promise<void> {
		if (!this.isAuthenticated) {
			return
		}

		try {
			await lastValueFrom(this.getUser())
		} catch(error) {
			console.warn('Session restoration failed:', error)
		}
	}

	// Synchronous getter for the current value
	public get currentUserValue(): IUser | null {
		return this.currentUserSubject.value
	}

	// Checks if the user is authenticated by looking on the authentication cookie
	private get isAuthenticated(): boolean {
		const cookies = document.cookie.split(';').map(cookie => cookie.trim())
		const authCookie = cookies.find(cookie => cookie.startsWith(`${this.IS_AUTHENTICATED_COOKIE_NAME}=`))
		return authCookie?.split('=')[1] === 'true'
	}

	signIn(payload: ISignInRequest): Observable<ISignInResponse> {
		return this.http.post<ISignInResponse>(`${this.apiUrl}/auth/login`, payload)
	}

	signUp(payload: ISignUpRequest): Observable<ISignUpResponse> {
		return this.http.post<ISignUpResponse>(`${this.apiUrl}/auth/register`, payload)
	}

	createPasswordReset(payload: ICreatePasswordResetRequest): Observable<void> {
		return this.http.post<void>(`${this.apiUrl}/auth/password/code`, payload, {
			context: new HttpContext().set(IGNORED_ERRORS, ['Your code has not expired yet'])
		})
	}

	resetPassword(payload: IResetPasswordRequest): Observable<void> {
		return this.http.post<void>(`${this.apiUrl}/auth/password/reset`, payload)
	}

	getUser(): Observable<IUser | null> {
		return this.http.get<{ user: IUser }>(`${this.apiUrl}/users/me`).pipe(
			map(({ user }) => user),
			tap((user) => {
				this.currentUserSubject.next(user)
			})
		)
	}

	refreshToken(): Observable<void> {
		return this.http.post<void>(`${this.apiUrl}/auth/generate-access-token`, {})
	}

	async logout(): Promise<void> {
		// Clear state
		this.currentUserSubject.next(null)
		// Clear cookie tokens
		await lastValueFrom(this.http.post(`${this.apiUrl}/auth/logout`, {}))

		this.router.navigate(['/auth/sign-in'])
	}
}