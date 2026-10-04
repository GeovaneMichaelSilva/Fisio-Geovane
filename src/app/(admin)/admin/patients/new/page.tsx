"use client";

import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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

import type { PatientFormParsed } from "@/lib/patients/schema";
import type { FC, ReactNode } from "react";

type ServiceType = {
	id: string;
	name: string;
	isActive: boolean;
};

const fetchServiceTypes = async () => {
	const res = await fetch("/api/admin/service-types");
	const json = await res.json();
	if (!res.ok) throw new Error(json.error || "Falha ao carregar tipos.");
	return json.data as ServiceType[];
};

const NewPatientPage: FC = () => {
	usePageTitle("Novo paciente");
	const router = useRouter();
	const queryClient = useQueryClient();

	const typesQuery = useQuery({
		queryKey: ["service-types"],
		queryFn: fetchServiceTypes
	});

	const createMutation = useMutation({
		mutationFn: async (values: PatientFormParsed) => {
			const res = await fetch("/api/admin/patients", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(values)
			});
			const json = await res.json();
			if (!res.ok) throw new Error(json.error || "Falha ao criar.");
			return json.data as { id: string };
		},
		onSuccess: (data) => {
			queryClient.invalidateQueries({ queryKey: ["patients"] });
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
				description="Preencha os dados principais. Campos sem * são opcionais."
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
