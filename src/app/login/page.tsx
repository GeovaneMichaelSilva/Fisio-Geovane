import { Suspense, type FC } from "react";

import LoginClient from "./LoginClient";

export const metadata = {
	title: "Login",
	robots: { index: false, follow: false }
};

const LoginPage: FC = () => {
	return (
		<Suspense fallback={<main className="bg-background min-h-screen" />}>
			<LoginClient />
		</Suspense>
	);
};

export default LoginPage;
