"use client";

import { Suspense } from "react";

import { FormSkeleton } from "@/components/admin/LoadingStates";
import { PageHeader } from "@/components/admin/PageStates";
import SettingsNav from "@/components/admin/SettingsNav";

import IntegrationsInner from "./components/IntegrationsInner";

import type { FC, ReactNode } from "react";

const IntegrationsFallback: FC = () => (
	<div className="space-y-6">
		<div className="space-y-3">
			<PageHeader title="Integrações" />
			<SettingsNav />
		</div>
		<FormSkeleton />
	</div>
);

const IntegrationsPage: FC = () => {
	let body: ReactNode = <IntegrationsInner />;
	return <Suspense fallback={<IntegrationsFallback />}>{body}</Suspense>;
};

export default IntegrationsPage;
