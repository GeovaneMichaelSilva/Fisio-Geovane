"use client";

import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle
} from "@/components/ui/AlertDialog";
import { Input } from "@/components/ui/Input";

import type { ComponentPropsWithoutRef, FC, ReactNode } from "react";

export type OverlapConflict = {
	id: string;
	patientName?: string;
	scheduledTime: string;
	durationMinutes: number;
	status?: string;
};

type OverlapConfirmDialogProps = {
	open: boolean;
	reason: string;
	pending?: boolean;
	conflicts?: OverlapConflict[];
	onReasonChange: (value: string) => void;
	onConfirm: () => void;
	onCancel: () => void;
} & Omit<
	ComponentPropsWithoutRef<typeof AlertDialog>,
	"open" | "onOpenChange" | "children"
>;

/**
 * Confirma override de sobreposição de horário com motivo obrigatório.
 */
const OverlapConfirmDialog: FC<OverlapConfirmDialogProps> = (props) => {
	const {
		open,
		reason,
		pending = false,
		conflicts = [],
		onReasonChange,
		onConfirm,
		onCancel,
		...restProps
	} = props;

	let conflictsList: ReactNode = null;
	if (conflicts.length > 0) {
		conflictsList = (
			<ul className="border-border bg-muted/40 space-y-2 rounded-md border p-3 text-sm">
				{conflicts.map((c) => {
					let patientSuffix: ReactNode = null;
					if (c.patientName) {
						patientSuffix = (
							<span className="text-muted-foreground">
								{" "}
								· {c.patientName}
							</span>
						);
					}

					return (
						<li key={c.id}>
							<span className="font-medium">
								{String(c.scheduledTime).slice(0, 5)} · {c.durationMinutes}
								min
							</span>
							{patientSuffix}
						</li>
					);
				})}
			</ul>
		);
	}

	const confirmLabel = pending ? "Salvando…" : "Salvar mesmo assim";

	return (
		<AlertDialog
			open={open}
			onOpenChange={(next) => {
				if (!next) onCancel();
			}}
			{...restProps}
		>
			<AlertDialogContent className="max-h-[90vh] overflow-y-auto">
				<AlertDialogHeader>
					<AlertDialogTitle>Sobreposição de horário</AlertDialogTitle>
					<AlertDialogDescription>
						Já existe outro atendimento nesse intervalo. Para salvar mesmo
						assim, informe o motivo do override.
					</AlertDialogDescription>
				</AlertDialogHeader>

				{conflictsList}

				<Input
					label={{ text: "Motivo do override", required: true }}
					value={reason}
					onChange={(e) => onReasonChange(e.target.value)}
					autoFocus
				/>
				<AlertDialogFooter>
					<AlertDialogCancel disabled={pending}>Ajustar horário</AlertDialogCancel>
					<AlertDialogAction
						disabled={pending || !reason.trim()}
						onClick={(e) => {
							e.preventDefault();
							onConfirm();
						}}
					>
						{confirmLabel}
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
};

export default OverlapConfirmDialog;
