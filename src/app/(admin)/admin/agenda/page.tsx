import { Suspense } from "react";

import { Skeleton } from "@/components/ui/Skeleton";

import AgendaClient from "./AgendaClient";

import type { FC, ReactNode } from "react";

const AgendaPageFallback: FC = () => (
	<div className="space-y-4">
		<Skeleton className="h-8 w-48" />
		<div className="grid gap-3 md:grid-cols-7">
			{Array.from({ length: 7 }).map((_, i) => (
				<Skeleton key={i} className="h-48 w-full" />
			))}
		</div>
	</div>
);

const AgendaPage: FC = () => {
	let body: ReactNode = <AgendaClient />;
	return (
		<Suspense fallback={<AgendaPageFallback />}>{body}</Suspense>
	);
};

export default AgendaPage;
