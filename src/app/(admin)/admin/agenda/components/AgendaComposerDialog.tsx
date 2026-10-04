"use client";

import Link from "next/link";
import { UseFormReturn } from "react-hook-form";

import EmptyState from "@/components/admin/EmptyState";
import { Button } from "@/components/ui/Button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle
} from "@/components/ui/Dialog";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";

import type { PatientOption, ServiceType } from "./types";
import type {
	SessionCreateInput,
	SessionCreateParsed
} from "@/lib/sessions/schema";
import type { FC } from "react";

type AgendaComposerDialogProps = {
	open: boolean;
	googleConnected: boolean;
	patientFilter: string;
	debouncedPatientQ: string;
	patientsLoading: boolean;
	patientsFetching: boolean;
	patientOptions: PatientOption[];
	serviceTypes: ServiceType[];
	form: UseFormReturn<SessionCreateInput, unknown, SessionCreateParsed>;
	pending: boolean;
	onOpenChange: (open: boolean) => void;
	onClose: () => void;
	onPatientFilterChange: (value: string) => void;
	onPatientChange: (id: string) => void;
	onServiceTypeChange: (id: string) => void;
	onSubmit: (values: SessionCreateParsed) => void;
};

const AgendaComposerDialog: FC<AgendaComposerDialogProps> = (props) => {
	const {
		open,
		googleConnected,
		patientFilter,
		debouncedPatientQ,
		patientsLoading,
		patientsFetching,
		patientOptions,
		serviceTypes,
		form,
		pending,
		onOpenChange,
		onClose,
		onPatientFilterChange,
		onPatientChange,
		onServiceTypeChange,
		onSubmit
	} = props;

	const errors = form.formState.errors;
	const syncHint = googleConnected
		? " Será sincronizado com o Google Agenda."
		: "";

	const noPatients =
		!patientsLoading && !debouncedPatientQ && patientOptions.length === 0;

	const saveLabel = pending ? "Salvando…" : "Salvar agendamento";

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
				<DialogHeader>
					<DialogTitle>Novo agendamento</DialogTitle>
					<DialogDescription>
						Duração padrão do tipo. Sobreposição exige override.
						{syncHint}
					</DialogDescription>
				</DialogHeader>
				{noPatients && (
					<EmptyState
						title="Cadastre um paciente antes de agendar"
						description="A agenda precisa de ao menos um paciente ativo."
						action={
							<Button asChild size="sm">
								<Link href="/admin/patients/new">Novo paciente</Link>
							</Button>
						}
					/>
				)}
				{!noPatients && (
					<form
						id="agenda-create-form"
						className="grid gap-4 sm:grid-cols-2"
						onSubmit={form.handleSubmit((values) =>
							onSubmit({ ...values, allowOverlap: false })
						)}
					>
						<div className="space-y-2 sm:col-span-2">
							<Input
								label={{ text: "Buscar paciente" }}
								placeholder="Nome, telefone ou CPF…"
								value={patientFilter}
								onChange={(e) => onPatientFilterChange(e.target.value)}
							/>
							<Select
								label={{ text: "Paciente", required: true }}
								value={form.watch("patientId")}
								onChange={(e) => onPatientChange(e.target.value)}
								placeholder={patientsFetching ? "Buscando…" : "Selecione…"}
								error={errors.patientId?.message}
								options={patientOptions.map((p) => ({
									value: p.id,
									label: p.fullName
								}))}
							/>
						</div>
						<Select
							className="sm:col-span-2"
							label={{ text: "Tipo", required: true }}
							value={form.watch("serviceTypeId")}
							onChange={(e) => onServiceTypeChange(e.target.value)}
							placeholder="Selecione…"
							error={errors.serviceTypeId?.message}
							options={serviceTypes
								.filter((t) => t.isActive)
								.map((t) => ({
									value: t.id,
									label: t.name
								}))}
						/>
						<Input
							label={{ text: "Data", required: true }}
							type="date"
							error={errors.scheduledDate?.message}
							{...form.register("scheduledDate")}
						/>
						<Input
							label={{ text: "Horário", required: true }}
							type="time"
							error={errors.scheduledTime?.message}
							{...form.register("scheduledTime")}
						/>
						<Input
							label={{ text: "Duração (min)", required: true }}
							type="number"
							inputMode="numeric"
							min={5}
							max={480}
							error={errors.durationMinutes?.message}
							{...form.register("durationMinutes", { valueAsNumber: true })}
						/>
						<Input
							label={{ text: "Valor (R$)", required: true }}
							type="number"
							inputMode="decimal"
							min={0}
							step="0.01"
							error={errors.valueBrl?.message}
							{...form.register("valueBrl", { valueAsNumber: true })}
						/>
					</form>
				)}
				<DialogFooter className="gap-2">
					<Button type="button" variant="ghost" onClick={onClose}>
						Cancelar
					</Button>
					<Button
						type="submit"
						form="agenda-create-form"
						className="min-h-11 sm:min-h-10"
						disabled={pending}
					>
						{saveLabel}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
};

export default AgendaComposerDialog;
