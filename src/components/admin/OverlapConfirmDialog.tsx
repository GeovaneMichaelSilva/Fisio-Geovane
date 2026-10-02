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

type OverlapConfirmDialogProps = {
	open: boolean;
	reason: string;
	pending?: boolean;
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
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>Sobreposição de horário</AlertDialogTitle>
					<AlertDialogDescription>
						Já existe outro atendimento nesse intervalo. Para salvar mesmo
						assim, informe o motivo do override.
					</AlertDialogDescription>
				</AlertDialogHeader>
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
