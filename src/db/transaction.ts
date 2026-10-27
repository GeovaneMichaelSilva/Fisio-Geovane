import { Pool, neonConfig } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import ws from "ws";

import * as schema from "./schema";

import type { ExtractTablesWithRelations } from "drizzle-orm";
import type { PgTransaction } from "drizzle-orm/pg-core";
import type { NeonQueryResultHKT } from "drizzle-orm/neon-serverless";

/** neon-http não tem transaction; usamos WebSocket Pool só nestes fluxos. */
neonConfig.webSocketConstructor = ws;

export type Tx = PgTransaction<
	NeonQueryResultHKT,
	typeof schema,
	ExtractTablesWithRelations<typeof schema>
>;

/**
 * Executa callback em transação real (WebSocket).
 * Abre e fecha o Pool a cada chamada — adequado a Route Handlers serverless.
 */
export const withTransaction = async <T>(fn: (tx: Tx) => Promise<T>): Promise<T> => {
	const url = process.env.DATABASE_URL;
	if (!url) {
		throw new Error("DATABASE_URL is not set");
	}

	const pool = new Pool({ connectionString: url });
	const db = drizzle(pool, { schema });

	try {
		return await db.transaction(fn);
	} finally {
		await pool.end();
	}
};
