"use client";

import { Suspense, use } from "react";

import { Skeleton } from "@/components/ui/Skeleton";

import SessionDetailClient from "./SessionDetailClient";

import type { FC } from "react";

type SessionDetailPageProps = {
	params: Promise<{ sessionId: string }>;
};

const SessionDetailFallback: FC = () => (
	<div className="space-y-4">
		<Skeleton className="h-8 w-64" />
		<Skeleton className="h-48 w-full" />
	</div>
);

const SessionDetailPage: FC<SessionDetailPageProps> = (props) => {
	const { params } = props;
	const { sessionId } = use(params);

	return (
		<Suspense fallback={<SessionDetailFallback />}>
			<SessionDetailClient sessionId={sessionId} />
		</Suspense>
	);
};

export default SessionDetailPage;
