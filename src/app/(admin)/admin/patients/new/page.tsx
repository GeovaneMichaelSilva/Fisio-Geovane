"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { PageHeader } from "@/components/admin/PageStates";
import PatientForm from "@/components/patients/PatientForm";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle
} from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { usePageTitle } from "@/hooks/usePageTitle";
import { useCreatePatientMutation } from "@/queries/patientQuery";
import { useServiceTypesQuery } from "@/queries/serviceTypeQuery";

import type { FC, ReactNode } from "react";

const NewPatientPage: FC = () => {
	usePageTitle("Novo paciente");
	const router = useRouter();

	const typesQuery = useServiceTypesQuery();

	const createMutation = useCreatePatientMutation({
		onSuccess: (data) => {
			toast.success("Paciente cadastrado.");
			router.replace(`/admin/patients/${data.id}`);
		},
		onError: (err: Error) => toast.error(err.message)
	});

	const firstActive = typesQuery.data?.find((t) => t.isActive)?.id ?? "";

	let formBody: ReactNode;
	if (typesQuery.isLoading) {
		formBody = (
			<div className="space-y-3">
				<Skeleton className="h-10 w-full" />
				<Skeleton className="h-10 w-full" />
				<Skeleton className="h-10 w-2/3" />
			</div>
		);
	} else if (typesQuery.isError) {
		formBody = (
			<p className="text-destructive text-sm" role="alert">
				{(typesQuery.error as Error).message}
			</p>
		);
	} else if (!firstActive) {
		formBody = (
			<p className="text-muted-foreground text-sm">
				Cadastre ao menos um tipo de atendimento ativo em Configurações antes
				de criar pacientes.
			</p>
		);
	} else {
		formBody = (
			<PatientForm
				defaultValues={{
					fullName: "",
					phone: "",
					cpf: "",
					birthDate: "",
					weightKg: null,
					heightCm: null,
					preferredServiceTypeId: firstActive,
					addressStreet: "",
					addressNumber: "",
					addressNeighborhood: "",
					addressCity: "",
					addressZip: "",
					notes: ""
				}}
				serviceTypes={typesQuery.data ?? []}
				submitLabel="Cadastrar"
				pending={createMutation.isPending}
				onSubmit={(values) => createMutation.mutate(values)}
				onCancel={() => router.push("/admin/patients")}
			/>
		);
	}

	return (
		<div className="space-y-6">
			<PageHeader
				title="Novo paciente"
				description="Preencha os dados. Campos com * vermelho são obrigatórios."
			/>

			<Card>
				<CardHeader>
					<CardTitle>Cadastro</CardTitle>
					<CardDescription>
						Após salvar, você será direcionado ao detalhe do paciente.
					</CardDescription>
				</CardHeader>
				<CardContent>{formBody}</CardContent>
			</Card>
		</div>
	);
};

export default NewPatientPage;
