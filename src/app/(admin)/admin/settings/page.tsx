"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
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
import { useClinicQuery, useUpdateClinicMutation } from "@/queries/clinicQuery";

import type { FC } from "react";

const SettingsPage: FC = () => {
	usePageTitle("Configurações");
	const { isOwner, isLoading: roleLoading } = useClinicRole();
	const canEdit = isOwner;

	const clinicQuery = useClinicQuery();

	const form = useForm<ClinicUpdateInput, unknown, ClinicUpdateParsed>({
		resolver: zodResolver(clinicUpdateSchema),
		defaultValues: {
			displayName: "",
			professionLabel: "Fisioterapeuta",
			licenseNumber: "",
			timezone: "America/Sao_Paulo",
			defaultSessionDurationMinutes: 50
		},
		mode: "all"
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

	const saveMutation = useUpdateClinicMutation({
		onSuccess: () => {
			toast.success("Dados da clínica salvos.");
		},
		onError: (err: Error) => toast.error(err.message)
	});

	const readOnlyHint =
		!roleLoading && !canEdit ? " Somente o responsável pode editar." : "";

	const clinicReady = !clinicQuery.isLoading && !clinicQuery.isError;

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
				<CardContent>
					{clinicQuery.isLoading && <FormSkeleton />}
					{clinicQuery.isError && (
						<ErrorState
							message={(clinicQuery.error as Error).message}
							onRetry={() => clinicQuery.refetch()}
						/>
					)}
					{clinicReady && (
						<form
							className="grid max-w-xl gap-4"
							onSubmit={form.handleSubmit((values) => {
								if (!canEdit) return;
								saveMutation.mutate(values);
							})}
						>
							<fieldset
								disabled={!canEdit}
								className="grid gap-4 disabled:opacity-80"
							>
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
										form.formState.errors.defaultSessionDurationMinutes
											?.message
									}
									{...form.register("defaultSessionDurationMinutes", {
										valueAsNumber: true
									})}
								/>
							</fieldset>
							{canEdit && (
								<div>
									<Button type="submit" disabled={saveMutation.isPending}>
										{saveMutation.isPending ? "Salvando…" : "Salvar"}
									</Button>
								</div>
							)}
						</form>
					)}
				</CardContent>
			</Card>
		</div>
	);
};

export default SettingsPage;
