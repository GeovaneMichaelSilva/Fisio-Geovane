"use client";

import { useId } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Textarea } from "@/components/ui/Textarea";
import { cn } from "@/utils";
import {
	patientFormSchema,
	type PatientFormParsed,
	type PatientFormValues
} from "@/lib/patients/schema";

type ServiceTypeOption = {
	id: string;
	name: string;
	isActive: boolean;
};

type PatientFormProps = {
	defaultValues: PatientFormValues;
	serviceTypes: ServiceTypeOption[];
	submitLabel?: string;
	pending?: boolean;
	onSubmit: (values: PatientFormParsed) => void;
	onCancel?: () => void;
	disabled?: boolean;
};

/**
 * Formulário compartilhado de paciente (novo + edição).
 */
export function PatientForm({
	defaultValues,
	serviceTypes,
	submitLabel = "Salvar",
	pending = false,
	onSubmit,
	onCancel,
	disabled = false
}: PatientFormProps) {
	const selectId = useId();
	const form = useForm<PatientFormValues, unknown, PatientFormParsed>({
		resolver: zodResolver(patientFormSchema),
		defaultValues
	});

	const activeOptions = serviceTypes.filter(
		(t) => t.isActive || t.id === defaultValues.preferredServiceTypeId
	);

	return (
		<form
			className="grid gap-4 md:grid-cols-2"
			onSubmit={form.handleSubmit(onSubmit)}
		>
			<Input
				className="md:col-span-2"
				label={{ text: "Nome completo", required: true }}
				disabled={disabled}
				error={form.formState.errors.fullName?.message}
				{...form.register("fullName")}
			/>
			<Input
				label={{ text: "Telefone" }}
				disabled={disabled}
				error={form.formState.errors.phone?.message}
				{...form.register("phone")}
			/>
			<Input
				label={{ text: "CPF" }}
				helperText="Apenas dígitos"
				disabled={disabled}
				error={form.formState.errors.cpf?.message}
				{...form.register("cpf")}
			/>
			<Input
				label={{ text: "Data de nascimento" }}
				type="date"
				disabled={disabled}
				error={form.formState.errors.birthDate?.message}
				{...form.register("birthDate")}
			/>
			<Label
				htmlFor={selectId}
				label={{ text: "Tipo preferencial", required: true }}
				error={form.formState.errors.preferredServiceTypeId?.message}
				disabled={disabled}
			>
				<select
					id={selectId}
					disabled={disabled}
					className={cn(
						"border-input bg-background flex h-10 w-full rounded-md border px-3 py-2 text-sm shadow-xs",
						"focus-visible:ring-ring/70 focus-visible:ring-[3px] focus-visible:outline-hidden",
						"disabled:cursor-not-allowed disabled:opacity-50"
					)}
					{...form.register("preferredServiceTypeId")}
				>
					<option value="">Selecione…</option>
					{activeOptions.map((t) => (
						<option key={t.id} value={t.id}>
							{t.name}
							{!t.isActive ? " (inativo)" : ""}
						</option>
					))}
				</select>
			</Label>
			<Input
				label={{ text: "Peso (kg)" }}
				type="number"
				step="0.1"
				min={1}
				max={500}
				disabled={disabled}
				error={form.formState.errors.weightKg?.message}
				{...form.register("weightKg", { valueAsNumber: true })}
			/>
			<Input
				label={{ text: "Altura (cm)" }}
				type="number"
				step="0.1"
				min={30}
				max={250}
				disabled={disabled}
				error={form.formState.errors.heightCm?.message}
				{...form.register("heightCm", { valueAsNumber: true })}
			/>
			<Input
				className="md:col-span-2"
				label={{ text: "Rua / logradouro" }}
				disabled={disabled}
				error={form.formState.errors.addressStreet?.message}
				{...form.register("addressStreet")}
			/>
			<Input
				label={{ text: "Número" }}
				disabled={disabled}
				error={form.formState.errors.addressNumber?.message}
				{...form.register("addressNumber")}
			/>
			<Input
				label={{ text: "Bairro" }}
				disabled={disabled}
				error={form.formState.errors.addressNeighborhood?.message}
				{...form.register("addressNeighborhood")}
			/>
			<Input
				label={{ text: "Cidade" }}
				disabled={disabled}
				error={form.formState.errors.addressCity?.message}
				{...form.register("addressCity")}
			/>
			<Input
				label={{ text: "CEP" }}
				helperText="8 dígitos"
				disabled={disabled}
				error={form.formState.errors.addressZip?.message}
				{...form.register("addressZip")}
			/>
			<div className="md:col-span-2">
				<Textarea
					label={{ text: "Observações" }}
					rows={3}
					disabled={disabled}
					error={form.formState.errors.notes?.message}
					{...form.register("notes")}
				/>
			</div>
			<div className="flex flex-wrap gap-2 md:col-span-2">
				<Button type="submit" disabled={disabled || pending}>
					{pending ? "Salvando…" : submitLabel}
				</Button>
				{onCancel ? (
					<Button type="button" variant="ghost" onClick={onCancel}>
						Cancelar
					</Button>
				) : null}
			</div>
		</form>
	);
}
