/**
 * Gera PDF do histórico clínico (sessões realizadas) do paciente.
 */
import { jsPDF } from "jspdf";

import { normalizeTime, STATUS_LABEL } from "@/lib/sessions/agenda";

const GREEN: [number, number, number] = [16, 64, 49];
const GOLD: [number, number, number] = [165, 137, 79];
const SAND: [number, number, number] = [224, 204, 173];

export type PatientPdfSession = {
	id: string;
	scheduledDate: string;
	scheduledTime: string;
	serviceTypeName: string;
	status: string;
	valueBrl: string;
	paid: boolean;
	assessment: string | null;
	evolution: string | null;
	activities: string | null;
	lastAudit?: { editedAt: string; reason: string } | null;
};

export type PatientPdfInput = {
	clinic: {
		displayName: string;
		professionLabel: string;
		licenseNumber: string | null;
	};
	patient: {
		fullName: string;
		phone: string | null;
		cpf: string | null;
	};
	sessions: PatientPdfSession[];
};

function formatBrl(value: string) {
	return Number(value).toLocaleString("pt-BR", {
		style: "currency",
		currency: "BRL"
	});
}

function wrapText(doc: jsPDF, text: string, maxWidth: number): string[] {
	return doc.splitTextToSize(text || "—", maxWidth) as string[];
}

/**
 * Monta e baixa o PDF do paciente.
 */
export function downloadPatientHistoryPdf(input: PatientPdfInput) {
	const doc = new jsPDF({ unit: "mm", format: "a4" });
	const pageW = doc.internal.pageSize.getWidth();
	const pageH = doc.internal.pageSize.getHeight();
	const margin = 14;
	const contentW = pageW - margin * 2;
	let y = margin;

	const ensureSpace = (needed: number) => {
		if (y + needed <= pageH - 18) return;
		drawFooter(doc, pageW, pageH);
		doc.addPage();
		y = margin;
		drawHeader(doc, input, pageW, margin);
		y = 42;
	};

	drawHeader(doc, input, pageW, margin);
	y = 42;

	doc.setTextColor(...GREEN);
	doc.setFont("helvetica", "bold");
	doc.setFontSize(12);
	doc.text("Historico de atendimentos", margin, y);
	y += 6;

	doc.setFont("helvetica", "normal");
	doc.setFontSize(10);
	doc.text(`Paciente: ${input.patient.fullName}`, margin, y);
	y += 5;
	if (input.patient.phone) {
		doc.text(`Telefone: ${input.patient.phone}`, margin, y);
		y += 5;
	}
	if (input.patient.cpf) {
		doc.text(`CPF: ${input.patient.cpf}`, margin, y);
		y += 5;
	}
	y += 4;

	if (input.sessions.length === 0) {
		doc.setTextColor(100);
		doc.text("Nenhum atendimento realizado.", margin, y);
	}

	for (const session of input.sessions) {
		ensureSpace(40);
		doc.setDrawColor(...GOLD);
		doc.setLineWidth(0.6);
		doc.line(margin, y, pageW - margin, y);
		y += 6;

		doc.setTextColor(...GREEN);
		doc.setFont("helvetica", "bold");
		doc.setFontSize(11);
		const time = normalizeTime(String(session.scheduledTime)).slice(0, 5);
		doc.text(
			`${session.scheduledDate} · ${time} · ${session.serviceTypeName}`,
			margin,
			y
		);
		y += 5;

		doc.setFont("helvetica", "normal");
		doc.setFontSize(9);
		doc.setTextColor(80);
		doc.text(
			`${STATUS_LABEL[session.status] ?? session.status} · ${formatBrl(session.valueBrl)}${session.paid ? " · pago" : " · em aberto"}`,
			margin,
			y
		);
		y += 6;

		const blocks: Array<[string, string]> = [
			["Avaliacao", session.assessment ?? ""],
			["Evolucao", session.evolution ?? ""],
			["Atividades", session.activities ?? ""]
		];

		for (const [label, value] of blocks) {
			const lines = wrapText(doc, value || "—", contentW);
			ensureSpace(8 + lines.length * 4.2);
			doc.setFont("helvetica", "bold");
			doc.setTextColor(...GREEN);
			doc.setFontSize(9);
			doc.text(label, margin, y);
			y += 4;
			doc.setFont("helvetica", "normal");
			doc.setTextColor(40);
			for (const line of lines) {
				ensureSpace(5);
				doc.text(line, margin, y);
				y += 4.2;
			}
			y += 2;
		}

		if (session.lastAudit) {
			ensureSpace(8);
			doc.setFontSize(8);
			doc.setTextColor(110);
			doc.text(
				`Ultima edicao: ${new Date(session.lastAudit.editedAt).toLocaleString("pt-BR")} — ${session.lastAudit.reason}`,
				margin,
				y
			);
			y += 6;
		}

		y += 2;
	}

	drawFooter(doc, pageW, pageH);
	const safeName = input.patient.fullName
		.normalize("NFD")
		.replace(/[\u0300-\u036f]/g, "")
		.replace(/[^a-zA-Z0-9]+/g, "-")
		.replace(/^-|-$/g, "")
		.slice(0, 40);
	doc.save(`historico-${safeName || "paciente"}.pdf`);
}

function drawHeader(
	doc: jsPDF,
	input: PatientPdfInput,
	pageW: number,
	margin: number
) {
	doc.setFillColor(...GREEN);
	doc.rect(0, 0, pageW, 28, "F");
	doc.setFillColor(...GOLD);
	doc.rect(0, 28, pageW, 1.5, "F");

	doc.setTextColor(255, 255, 255);
	doc.setFont("helvetica", "bold");
	doc.setFontSize(14);
	doc.text(input.clinic.displayName.toUpperCase(), margin, 12);
	doc.setFont("helvetica", "normal");
	doc.setFontSize(9);
	doc.setTextColor(...SAND);
	const cred = [
		input.clinic.professionLabel,
		input.clinic.licenseNumber ? `Crefito: ${input.clinic.licenseNumber}` : null
	]
		.filter(Boolean)
		.join(" · ");
	doc.text(cred, margin, 19);
}

function drawFooter(doc: jsPDF, pageW: number, pageH: number) {
	const page = doc.getNumberOfPages();
	doc.setPage(page);
	doc.setDrawColor(...SAND);
	doc.setLineWidth(0.4);
	doc.line(14, pageH - 12, pageW - 14, pageH - 12);
	doc.setFontSize(8);
	doc.setTextColor(120);
	doc.text(
		"Documento confidencial — uso exclusivo do profissional e do paciente.",
		14,
		pageH - 7
	);
	doc.text(`Pag. ${page}`, pageW - 14, pageH - 7, { align: "right" });
}
