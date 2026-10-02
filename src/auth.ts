import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import { eq } from "drizzle-orm";
import { z } from "zod";

import { getDb } from "@/db";
import { users } from "@/db/schema";

const loginSchema = z.object({
	email: z.string().email(),
	password: z.string().min(1)
});

export const { handlers, auth, signIn, signOut } = NextAuth({
	providers: [
		Credentials({
			name: "Credentials",
			credentials: {
				email: { label: "E-mail", type: "email" },
				password: { label: "Senha", type: "password" }
			},
			async authorize(credentials) {
				const parsed = loginSchema.safeParse(credentials);
				if (!parsed.success) return null;

				const email = parsed.data.email.trim().toLowerCase();
				const db = getDb();
				const [user] = await db
					.select()
					.from(users)
					.where(eq(users.email, email))
					.limit(1);

				if (!user) return null;

				const valid = await compare(parsed.data.password, user.passwordHash);
				if (!valid) return null;

				return {
					id: user.id,
					email: user.email,
					name: user.fullName,
					role: user.role
				};
			}
		})
	],
	session: {
		strategy: "jwt",
		maxAge: 30 * 24 * 60 * 60
	},
	pages: {
		signIn: "/login"
	},
	callbacks: {
		async jwt({ token, user }) {
			if (user) {
				token.id = user.id;
				token.role = user.role ?? "owner";
			}
			return token;
		},
		async session({ session, token }) {
			if (session.user) {
				session.user.id = (token.id as string) || (token.sub as string) || "";
				session.user.role =
					(token.role as "owner" | "staff" | undefined) ?? "owner";
			}
			return session;
		}
	},
	trustHost: true
});
