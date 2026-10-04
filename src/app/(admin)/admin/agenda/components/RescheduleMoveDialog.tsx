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
import { normalizeTime } from "@/lib/sessions/agenda";
import { cn } from "@/utils";

import type { AgendaSession } from "./types";
import type { ComponentPropsWithoutRef, FC, ReactNode } from "react";

export type PendingMove = {
	session: AgendaSession;
	toDate: string;
	toTime: string;
	durationMinutes: number;
};

type RescheduleMoveDialogProps = {
	pending: PendingMove | null;
	saving?: boolean;
	/** Quando true, este diálogo fica oculto (ex.: overlap aberto). */
	suppressed?: boolean;
	onConfirm: () => void;
	onCancel: () => void;
} & Omit<
	ComponentPropsWithoutRef<typeof AlertDialog>,
	"open" | "onOpenChange" | "children"
>;

const formatDay = (dateStr: string) =>
	new Date(`${dateStr}T12:00:00`).toLocaleDateString("pt-BR", {
		weekday: "long",
		day: "2-digit",
		month: "short"
	});

type ChangeFlags = {
	date: boolean;
	time: boolean;
	duration: boolean;
};

const summarizeChanges = (flags: ChangeFlags): string => {
	const parts: string[] = [];
	if (flags.date) parts.push("data");
	if (flags.time) parts.push("horário");
	if (flags.duration) parts.push("duração");
	if (parts.length === 0) return "Nenhuma alteração detectada.";
	if (parts.length === 1) return `Alterando só ${parts[0]}.`;
	if (parts.length === 2) return `Alterando ${parts[0]} e ${parts[1]}.`;
	return `Alterando ${parts[0]}, ${parts[1]} e ${parts[2]}.`;
};

const Part: FC<{ highlight?: boolean; children: ReactNode }> = (props) => {
	const { highlight = false, children } = props;
	return (
		<span
			className={cn(
				highlight &&
					"bg-brand/20 text-foreground rounded px-1 py-0.5 font-semibold"
			)}
		>
			{children}
		</span>
	);
};

const SlotLine: FC<{
	dateStr: string;
	time: string;
	durationMinutes: number;
	highlight?: ChangeFlags;
}> = (props) => {
	const {
		dateStr,
		time,
		durationMinutes,
		highlight = { date: false, time: false, duration: false }
	} = props;

	return (
		<p className="text-foreground mt-0.5 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-sm">
			<Part highlight={highlight.date}>{formatDay(dateStr)}</Part>
			<span className="text-muted-foreground" aria-hidden>
				·
			</span>
			<Part highlight={highlight.time}>{time}</Part>
			<span className="text-muted-foreground" aria-hidden>
				·
			</span>
			<Part highlight={highlight.duration}>{durationMinutes} min</Part>
		</p>
	);
};

/**
 * Confirma remarcação via calendário (data/hora/duração).
 * Mostra o slot completo e destaca só o que mudou.
 */
const RescheduleMoveDialog: FC<RescheduleMoveDialogProps> = (props) => {
	const {
		pending,
		saving = false,
		suppressed = false,
		onConfirm,
		onCancel,
		...restProps
	} = props;
	const open = Boolean(pending) && !suppressed;

	const fromTime = pending
		? normalizeTime(String(pending.session.scheduledTime)).slice(0, 5)
		: "";
	const toTime = pending?.toTime ?? "";
	const fromDuration = pending?.session.durationMinutes ?? 0;
	const toDuration = pending?.durationMinutes ?? 0;

	const flags: ChangeFlags = pending
		? {
				date: pending.session.scheduledDate !== pending.toDate,
				time: fromTime !== toTime,
				duration: fromDuration !== toDuration
			}
		: { date: false, time: false, duration: false };

	return (
		<AlertDialog
			open={open}
			onOpenChange={(next) => {
				if (!next) onCancel();
			}}
			{...restProps}
		>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>Remarcar atendimento?</AlertDialogTitle>
					{pending && (
						<div className="space-y-3">
							<AlertDialogDescription>
								Confirme a remarcação de{" "}
								<span className="text-foreground font-medium">
									{pending.session.patientName}
								</span>
								. {summarizeChanges(flags)}
							</AlertDialogDescription>
							<div className="border-border bg-muted/40 space-y-3 rounded-md border p-3">
								<div>
									<p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
										Atual
									</p>
									<SlotLine
										dateStr={pending.session.scheduledDate}
										time={fromTime}
										durationMinutes={fromDuration}
									/>
								</div>
								<div>
									<p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
										Novo
									</p>
									<SlotLine
										dateStr={pending.toDate}
										time={toTime}
										durationMinutes={toDuration}
										highlight={flags}
									/>
								</div>
							</div>
						</div>
					)}
				</AlertDialogHeader>
				<AlertDialogFooter>
					<AlertDialogCancel disabled={saving} onClick={onCancel}>
						Cancelar
					</AlertDialogCancel>
					<AlertDialogAction
						disabled={saving}
						onClick={(e) => {
							e.preventDefault();
							onConfirm();
						}}
					>
						{saving ? "Salvando…" : "Confirmar"}
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
};

export default RescheduleMoveDialog;
