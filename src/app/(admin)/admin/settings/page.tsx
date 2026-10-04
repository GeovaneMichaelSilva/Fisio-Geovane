"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { FormSkeleton } from "@/components/admin/LoadingStates";
import { ErrorState, PageHeader } from "@/components/admin/PageStates";
import SettingsNav from "@/components/admin/SettingsNav";
import { Button } from "@/components/ui/Button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle
} from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { useClinicRole } from "@/hooks/useClinicRole";
import { usePageTitle } from "@/hooks/usePageTitle";
import {
	clinicUpdateSchema,
	type ClinicUpdateInput,
	type ClinicUpdateParsed
} from "@/lib/clinic/schema";

import type { FC, ReactNode } from "react";

type Clinic = {
	id: string;
	displayName: string;
	professionLabel: string;
	licenseNumber: string | null;
	timezone: string;
	defaultSessionDurationMinutes: number;
};

const fetchClinic = async (): Promise<Clinic> => {
	const res = await fetch("/api/admin/clinic");
	const json = await res.json();
	if (!res.ok) throw new Error(json.error || "Falha ao carregar.");
	return json.data;
};

const SettingsPage: FC = () => {
	usePageTitle("Configurações");
	const queryClient = useQueryClient();
	const { isOwner, isLoading: roleLoading } = useClinicRole();
	const canEdit = isOwner;

	const clinicQuery = useQuery({
		queryKey: ["clinic"],
		queryFn: fetchClinic
	});

	const form = useForm<ClinicUpdateInput, unknown, ClinicUpdateParsed>({
		resolver: zodResolver(clinicUpdateSchema),
		defaultValues: {
			displayName: "",
			professionLabel: "Fisioterapeuta",
			licenseNumber: "",
			timezone: "America/Sao_Paulo",
			defaultSessionDurationMinutes: 50
		}
	});

	useEffect(() => {
		if (!clinicQuery.data) return;
		form.reset({
			displayName: clinicQuery.data.displayName,
			professionLabel: clinicQuery.data.professionLabel,
			licenseNumber: clinicQuery.data.licenseNumber ?? "",
			timezone: clinicQuery.data.timezone,
			defaultSessionDurationMinutes:
				clinicQuery.data.defaultSessionDurationMinutes
		});
	}, [clinicQuery.data, form]);

	const saveMutation = useMutation({
		mutationFn: async (values: ClinicUpdateParsed) => {
			const res = await fetch("/api/admin/clinic", {
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(values)
			});
			const json = await res.json();
			if (!res.ok) throw new Error(json.error || "Falha ao salvar.");
			return json.data as Clinic;
		},
		onSuccess: (data) => {
			queryClient.setQueryData(["clinic"], data);
			toast.success("Dados da clínica salvos.");
		},
		onError: (err: Error) => toast.error(err.message)
	});

	const readOnlyHint =
		!roleLoading && !canEdit ? " Somente o responsável pode editar." : "";

	let clinicFormBody: ReactNode;
	if (clinicQuery.isLoading) {
		clinicFormBody = <FormSkeleton />;
	} else if (clinicQuery.isError) {
		clinicFormBody = (
			<ErrorState
				message={(clinicQuery.error as Error).message}
				onRetry={() => clinicQuery.refetch()}
			/>
		);
	} else {
		clinicFormBody = (
			<form
				className="grid max-w-xl gap-4"
				onSubmit={form.handleSubmit((values) => {
					if (!canEdit) return;
					saveMutation.mutate(values);
				})}
			>
				<fieldset disabled={!canEdit} className="grid gap-4 disabled:opacity-80">
					<Input
						label={{ text: "Nome exibido", required: true }}
						error={form.formState.errors.displayName?.message}
						{...form.register("displayName")}
					/>
					<Input
						label={{ text: "Profissão", required: true }}
						helperText="Aparece no cabeçalho do PDF (ex.: Fisioterapeuta)."
						error={form.formState.errors.professionLabel?.message}
						{...form.register("professionLabel")}
					/>
					<Input
						label={{ text: "Crefito / registro" }}
						helperText="Ex.: 549225-F"
						error={form.formState.errors.licenseNumber?.message}
						{...form.register("licenseNumber")}
					/>
					<Input
						label={{ text: "Fuso horário", required: true }}
						error={form.formState.errors.timezone?.message}
						{...form.register("timezone")}
					/>
					<Input
						label={{
							text: "Duração padrão da sessão (min)",
							required: true
						}}
						type="number"
						min={5}
						max={480}
						error={
							form.formState.errors.defaultSessionDurationMinutes?.message
						}
						{...form.register("defaultSessionDurationMinutes", {
							valueAsNumber: true
						})}
					/>
				</fieldset>
				{canEdit ? (
					<div>
						<Button type="submit" disabled={saveMutation.isPending}>
							{saveMutation.isPending ? "Salvando…" : "Salvar"}
						</Button>
					</div>
				) : null}
			</form>
		);
	}

	return (
		<div className="space-y-6">
			<div className="space-y-3">
				<PageHeader
					title="Configurações"
					description="Dados da clínica, tipos de atendimento, equipe e integrações."
				/>
				<SettingsNav />
			</div>

			<Card>
				<CardHeader>
					<CardTitle>Clínica</CardTitle>
					<CardDescription>
						Nome profissional, registro e duração padrão das sessões.
						{readOnlyHint}
					</CardDescription>
				</CardHeader>
				<CardContent>{clinicFormBody}</CardContent>
			</Card>
		</div>
	);
};

export default SettingsPage;
