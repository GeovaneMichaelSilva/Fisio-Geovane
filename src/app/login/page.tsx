import { Suspense } from "react";

import LoginClient from "./LoginClient";

export const metadata = {
	title: "Login",
	robots: { index: false, follow: false }
};

export default function LoginPage() {
	return (
		<Suspense fallback={<main className="bg-background min-h-screen" />}>
			<LoginClient />
		</Suspense>
	);
}
