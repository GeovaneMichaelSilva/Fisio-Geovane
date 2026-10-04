import { Suspense, type FC } from "react";

import UpdatePasswordClient from "./UpdatePasswordClient";

export const metadata = {
	title: "Nova senha",
	robots: { index: false, follow: false }
};

const UpdatePasswordPage: FC = () => {
	return (
		<Suspense fallback={<main className="bg-background min-h-screen" />}>
			<UpdatePasswordClient />
		</Suspense>
	);
};

export default UpdatePasswordPage;
