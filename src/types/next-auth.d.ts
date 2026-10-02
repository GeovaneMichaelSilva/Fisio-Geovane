import { type DefaultSession } from "next-auth";

declare module "next-auth" {
	interface User {
		role?: "owner" | "staff";
	}

	interface Session {
		user: {
			id: string;
			role: "owner" | "staff";
		} & DefaultSession["user"];
	}
}

declare module "next-auth/jwt" {
	interface JWT {
		id?: string;
		role?: "owner" | "staff";
	}
}
