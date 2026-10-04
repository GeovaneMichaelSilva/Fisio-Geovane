"use client";

import { use } from "react";

import PatientDetailClient from "./PatientDetailClient";

import type { FC } from "react";

type PatientDetailPageProps = {
	params: Promise<{ patientId: string }>;
};

const PatientDetailPage: FC<PatientDetailPageProps> = (props) => {
	const { params } = props;
	const { patientId } = use(params);
	return <PatientDetailClient patientId={patientId} />;
};

export default PatientDetailPage;
