import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import { eq } from "drizzle-orm";

import { getDb } from "@/db";
import { users } from "@/db/schema";
import { loginSchema } from "@/lib/auth/schema";

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
				token.name = user.name;
				token.email = user.email;
			}
			return token;
		},
		async session({ session, token }) {
			if (session.user) {
				session.user.id = (token.id as string) || (token.sub as string) || "";
				session.user.role =
					(token.role as "owner" | "staff" | undefined) ?? "owner";
				if (token.name) session.user.name = token.name as string;
				if (token.email) session.user.email = token.email as string;
			}
			return session;
		}
	},
	trustHost: true
});
