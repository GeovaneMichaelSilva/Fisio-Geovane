"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
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
 * Formulário de paciente em seções (melhor leitura no mobile).
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
	const form = useForm<PatientFormValues, unknown, PatientFormParsed>({
		resolver: zodResolver(patientFormSchema),
		defaultValues
	});

	const activeOptions = serviceTypes.filter(
		(t) => t.isActive || t.id === defaultValues.preferredServiceTypeId
	);

	return (
		<form className="space-y-8" onSubmit={form.handleSubmit(onSubmit)}>
			<section className="space-y-4">
				<div>
					<h3 className="text-sm font-medium">Dados pessoais</h3>
					<p className="text-muted-foreground text-xs">
						Informações principais do paciente.
					</p>
				</div>
				<div className="grid gap-4 sm:grid-cols-2">
					<Input
						className="sm:col-span-2"
						label={{ text: "Nome completo", required: true }}
						disabled={disabled}
						error={form.formState.errors.fullName?.message}
						{...form.register("fullName")}
					/>
					<Input
						label={{ text: "Telefone" }}
						inputMode="tel"
						disabled={disabled}
						error={form.formState.errors.phone?.message}
						{...form.register("phone")}
					/>
					<Input
						label={{ text: "CPF" }}
						helperText="Opcional · 11 dígitos, com ou sem pontuação"
						inputMode="numeric"
						autoComplete="off"
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
					<Select
						label={{ text: "Tipo preferencial", required: true }}
						disabled={disabled}
						error={form.formState.errors.preferredServiceTypeId?.message}
						placeholder="Selecione…"
						options={activeOptions.map((t) => ({
							value: t.id,
							label: t.isActive ? t.name : `${t.name} (inativo)`
						}))}
						{...form.register("preferredServiceTypeId")}
					/>
					<Input
						label={{ text: "Peso (kg)" }}
						type="number"
						inputMode="decimal"
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
						inputMode="decimal"
						step="0.1"
						min={30}
						max={250}
						disabled={disabled}
						error={form.formState.errors.heightCm?.message}
						{...form.register("heightCm", { valueAsNumber: true })}
					/>
				</div>
			</section>

			<section className="space-y-4">
				<div>
					<h3 className="text-sm font-medium">Endereço</h3>
					<p className="text-muted-foreground text-xs">Opcional.</p>
				</div>
				<div className="grid gap-4 sm:grid-cols-2">
					<Input
						className="sm:col-span-2"
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
						inputMode="numeric"
						disabled={disabled}
						error={form.formState.errors.addressZip?.message}
						{...form.register("addressZip")}
					/>
				</div>
			</section>

			<section className="space-y-4">
				<div>
					<h3 className="text-sm font-medium">Observações</h3>
					<p className="text-muted-foreground text-xs">
						Anotações gerais do cadastro.
					</p>
				</div>
				<Textarea
					label={{ text: "Notas" }}
					rows={3}
					disabled={disabled}
					error={form.formState.errors.notes?.message}
					{...form.register("notes")}
				/>
			</section>

			<div className="bg-background/95 sticky bottom-16 z-10 -mx-4 flex flex-wrap gap-2 border-t px-4 py-3 sm:static sm:bottom-0 sm:mx-0 sm:border-0 sm:bg-transparent sm:px-0 sm:py-0">
				<Button
					type="submit"
					className="min-h-11 flex-1 sm:min-h-10 sm:flex-none"
					disabled={disabled || pending}
				>
					{pending ? "Salvando…" : submitLabel}
				</Button>
				{onCancel ? (
					<Button
						type="button"
						variant="ghost"
						className="min-h-11 sm:min-h-10"
						onClick={onCancel}
					>
						Cancelar
					</Button>
				) : null}
			</div>
		</form>
	);
}
