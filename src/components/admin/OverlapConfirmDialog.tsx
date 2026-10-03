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
};

/**
 * Confirma override de sobreposição de horário com motivo obrigatório.
 */
export function OverlapConfirmDialog({
	open,
	reason,
	pending = false,
	conflicts = [],
	onReasonChange,
	onConfirm,
	onCancel
}: OverlapConfirmDialogProps) {
	return (
		<AlertDialog
			open={open}
			onOpenChange={(next) => {
				if (!next) onCancel();
			}}
		>
			<AlertDialogContent className="max-h-[90vh] overflow-y-auto">
				<AlertDialogHeader>
					<AlertDialogTitle>Sobreposição de horário</AlertDialogTitle>
					<AlertDialogDescription>
						Já existe outro atendimento nesse intervalo. Para salvar mesmo
						assim, informe o motivo do override.
					</AlertDialogDescription>
				</AlertDialogHeader>

				{conflicts.length > 0 ? (
					<ul className="border-border bg-muted/40 space-y-2 rounded-md border p-3 text-sm">
						{conflicts.map((c) => (
							<li key={c.id}>
								<span className="font-medium">
									{String(c.scheduledTime).slice(0, 5)} · {c.durationMinutes}
									min
								</span>
								{c.patientName ? (
									<span className="text-muted-foreground">
										{" "}
										· {c.patientName}
									</span>
								) : null}
							</li>
						))}
					</ul>
				) : null}

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
						{pending ? "Salvando…" : "Salvar mesmo assim"}
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}
