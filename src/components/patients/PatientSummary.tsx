import { formatCpf } from "@/lib/patients/cpf";

import type { FC, ReactNode } from "react";

type PatientSummaryData = {
	fullName: string;
	phone: string | null;
	cpf: string | null;
	birthDate: string | null;
	weightKg: string | null;
	heightCm: string | null;
	preferredServiceTypeName: string;
	addressStreet: string | null;
	addressNumber: string | null;
	addressNeighborhood: string | null;
	addressCity: string | null;
	addressZip: string | null;
	notes: string | null;
};

type FieldProps = {
	label: string;
	value: ReactNode;
};

const Field: FC<FieldProps> = (props) => {
	const { label, value } = props;
	const empty =
		value === null ||
		value === undefined ||
		value === "" ||
		(typeof value === "string" && value.trim() === "");

	return (
		<div className="space-y-1">
			<p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
				{label}
			</p>
			<p className="text-sm break-words">
				{empty ? (
					<span className="text-muted-foreground">Não informado</span>
				) : (
					value
				)}
			</p>
		</div>
	);
};

const formatBirthDate = (iso: string | null) => {
	if (!iso) return null;
	const [y, m, d] = iso.split("-");
	if (!y || !m || !d) return iso;
	return `${d}/${m}/${y}`;
};

const formatAddress = (p: PatientSummaryData) => {
	const line1 = [p.addressStreet, p.addressNumber].filter(Boolean).join(", ");
	const line2 = [p.addressNeighborhood, p.addressCity, p.addressZip]
		.filter(Boolean)
		.join(" · ");
	const parts = [line1, line2].filter(Boolean);
	return parts.length ? parts.join("\n") : null;
};

type PatientSummaryProps = {
	patient: PatientSummaryData;
};

/**
 * Visualização somente leitura do cadastro do paciente.
 */
const PatientSummary: FC<PatientSummaryProps> = (props) => {
	const { patient } = props;
	const address = formatAddress(patient);

	return (
		<div className="space-y-6">
			<section className="grid gap-4 sm:grid-cols-2">
				<Field label="Nome completo" value={patient.fullName} />
				<Field
					label="Tipo preferencial"
					value={patient.preferredServiceTypeName}
				/>
				<Field label="Telefone" value={patient.phone} />
				<Field label="CPF" value={formatCpf(patient.cpf)} />
				<Field
					label="Data de nascimento"
					value={formatBirthDate(patient.birthDate)}
				/>
				<Field
					label="Peso"
					value={patient.weightKg ? `${patient.weightKg} kg` : null}
				/>
				<Field
					label="Altura"
					value={patient.heightCm ? `${patient.heightCm} cm` : null}
				/>
			</section>

			<section className="space-y-3">
				<p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
					Endereço
				</p>
				{address ? (
					<p className="text-sm whitespace-pre-line">{address}</p>
				) : (
					<p className="text-muted-foreground text-sm">Não informado</p>
				)}
			</section>

			<section className="space-y-3">
				<p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
					Observações
				</p>
				{patient.notes ? (
					<p className="text-sm whitespace-pre-wrap">{patient.notes}</p>
				) : (
					<p className="text-muted-foreground text-sm">Nenhuma observação.</p>
				)}
			</section>
		</div>
	);
};

export default PatientSummary;
