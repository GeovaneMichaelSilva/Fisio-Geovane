import { Suspense } from "react";

import UpdatePasswordClient from "./UpdatePasswordClient";

export const metadata = {
	title: "Nova senha",
	robots: { index: false, follow: false }
};

export default function UpdatePasswordPage() {
	return (
		<Suspense fallback={<main className="bg-background min-h-screen" />}>
			<UpdatePasswordClient />
		</Suspense>
	);
}
