"use client";

import { Suspense, use } from "react";

import { Skeleton } from "@/components/ui/Skeleton";

import PatientDetailClient from "./PatientDetailClient";

import type { FC } from "react";

type PatientDetailPageProps = {
	params: Promise<{ patientId: string }>;
};

const PatientDetailPage: FC<PatientDetailPageProps> = (props) => {
	const { params } = props;
	const { patientId } = use(params);

	return (
		<Suspense
			fallback={
				<div className="space-y-4">
					<Skeleton className="h-10 w-1/2" />
					<Skeleton className="h-40 w-full" />
				</div>
			}
		>
			<PatientDetailClient patientId={patientId} />
		</Suspense>
	);
};

export default PatientDetailPage;
