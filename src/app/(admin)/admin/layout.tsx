import { auth } from "@/auth";

import AdminShell from "./AdminShell";

export const metadata = {
	robots: { index: false, follow: false },
	title: {
		default: "Admin",
		template: "%s · Geovane Michael da Silva"
	}
};

/**
 * Gate server (sessão) + shell client (SPA-like).
 * Páginas filhas do /admin são client components + React Query.
 */
export default async function AdminLayout({
	children
}: {
	children: React.ReactNode;
}) {
	const session = await auth();

	return (
		<AdminShell name={session?.user?.name} email={session?.user?.email}>
			{children}
		</AdminShell>
	);
}
