import 'dotenv/config'

import { genSalt, hash } from 'bcrypt'
import { eq } from 'drizzle-orm'

import { drizzleClient } from '@integrator-packages/database/drizzle/client'
import { marketplaceProviders, users } from '@integrator-packages/database/drizzle/tables'

// This script must not import '@config/env': its validator strips every variable
// that is not part of the schema from process.env, including the SEED_* ones.
const {
	SEED_WEB_URL,
	SEED_USER_NAME,
	SEED_USER_EMAIL,
	SEED_USER_PASSWORD,
	SEED_MELI_CLIENT_ID,
	SEED_MELI_CLIENT_SECRET,
	SEED_MAGALU_CLIENT_ID,
	SEED_MAGALU_CLIENT_SECRET,
	SEED_MAGALU_BASE_URL = 'https://api-sandbox.magalu.com'
} = process.env

type ProviderSeed = Omit<typeof marketplaceProviders.$inferInsert, 'id'>

const buildRedirectUri = (providerPath: string) => {
	if (!SEED_WEB_URL) {
		throw new Error('SEED_WEB_URL is required to build the providers redirect_uri')
	}

	return `${SEED_WEB_URL.replace(/\/+$/, '')}/integrations/oauth/callback/${providerPath}`
}

const getProviders = (): ProviderSeed[] => {
	const providers: ProviderSeed[] = []

	if (SEED_MELI_CLIENT_ID && SEED_MELI_CLIENT_SECRET) {
		providers.push({
			provider: 'mercado_livre',
			display_name: 'Mercado Livre',
			is_active: true,
			client_id: SEED_MELI_CLIENT_ID,
			client_secret: SEED_MELI_CLIENT_SECRET,
			redirect_uri: buildRedirectUri('mercado-livre'),
			base_url: 'https://api.mercadolibre.com/',
			token_url: 'https://api.mercadolibre.com/',
			auth_url: 'https://auth.mercadolivre.com.br/authorization'
		})
	} else {
		console.warn('[seed] Mercado Livre skipped: SEED_MELI_CLIENT_ID/SEED_MELI_CLIENT_SECRET not set')
	}

	if (SEED_MAGALU_CLIENT_ID && SEED_MAGALU_CLIENT_SECRET) {
		providers.push({
			provider: 'magalu',
			display_name: SEED_MAGALU_BASE_URL.includes('sandbox') ? 'Magalu Sandbox' : 'Magalu',
			is_active: true,
			client_id: SEED_MAGALU_CLIENT_ID,
			client_secret: SEED_MAGALU_CLIENT_SECRET,
			redirect_uri: buildRedirectUri('magalu'),
			base_url: SEED_MAGALU_BASE_URL,
			token_url: 'https://id.magalu.com',
			auth_url: 'https://id.magalu.com/login'
		})
	} else {
		console.warn('[seed] Magalu skipped: SEED_MAGALU_CLIENT_ID/SEED_MAGALU_CLIENT_SECRET not set')
	}

	return providers
}

const seedProviders = async() => {
	for (const data of getProviders()) {
		const [existing] = await drizzleClient
			.select({ id: marketplaceProviders.id })
			.from(marketplaceProviders)
			.where(eq(marketplaceProviders.provider, data.provider))
			.limit(1)

		if (existing) {
			// Keeps the id, since marketplace accounts reference it
			await drizzleClient.update(marketplaceProviders).set(data).where(eq(marketplaceProviders.id, existing.id))
			console.log(`[seed] Provider ${data.provider} updated (${existing.id})`)
			continue
		}

		const [created] = await drizzleClient
			.insert(marketplaceProviders)
			.values(data)
			.returning({ id: marketplaceProviders.id })
		console.log(`[seed] Provider ${data.provider} created (${created.id})`)
	}
}

const seedUser = async() => {
	if (!SEED_USER_EMAIL || !SEED_USER_PASSWORD) {
		console.warn('[seed] Initial user skipped: SEED_USER_EMAIL/SEED_USER_PASSWORD not set')
		return
	}
	if (SEED_USER_PASSWORD.length < 8) {
		throw new Error('SEED_USER_PASSWORD must have at least 8 characters')
	}

	const [existing] = await drizzleClient
		.select({ id: users.id })
		.from(users)
		.where(eq(users.email, SEED_USER_EMAIL))
		.limit(1)

	if (existing) {
		// Never overwrites the password of an existing user
		console.log(`[seed] User ${SEED_USER_EMAIL} already exists (${existing.id}), skipping`)
		return
	}

	const [created] = await drizzleClient.insert(users).values({
		name: SEED_USER_NAME || 'Admin',
		email: SEED_USER_EMAIL,
		password: await hash(SEED_USER_PASSWORD, await genSalt(12))
	}).returning({ id: users.id })

	console.log(`[seed] User ${SEED_USER_EMAIL} created (${created.id})`)
}

try {
	await seedProviders()
	await seedUser()

	console.log('[seed] Done')
	process.exit(0)
} catch(error) {
	console.error('[seed] Failed', error)
	process.exit(1)
}
