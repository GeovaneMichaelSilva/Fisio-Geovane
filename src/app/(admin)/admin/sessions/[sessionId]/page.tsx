"use client";

import { Suspense, use } from "react";

import { Skeleton } from "@/components/ui/Skeleton";

import SessionDetailClient from "./SessionDetailClient";

import type { FC, ReactNode } from "react";

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

	let body: ReactNode = <SessionDetailClient sessionId={sessionId} />;

	return <Suspense fallback={<SessionDetailFallback />}>{body}</Suspense>;
};

export default SessionDetailPage;
