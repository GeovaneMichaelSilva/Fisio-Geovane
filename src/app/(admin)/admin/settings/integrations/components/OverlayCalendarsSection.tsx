"use client";

import { useEffect, useMemo, useState } from "react";

import { FormSkeleton } from "@/components/admin/LoadingStates";
import { ErrorState } from "@/components/admin/PageStates";
import { Button } from "@/components/ui/Button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle
} from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";

import type { FC } from "react";
import type {
	GoogleCalendarOption,
	GoogleCalendarSubscription
} from "@/queries/googleIntegrationsQuery";

type OverlayCalendarsSectionProps = {
	calendars: GoogleCalendarOption[] | undefined;
	calendarsLoading: boolean;
	calendarsError: Error | null;
	onCalendarsRetry: () => void;
	subscriptions: GoogleCalendarSubscription[] | undefined;
	subscriptionsLoading: boolean;
	subscriptionsError: Error | null;
	onSubscriptionsRetry: () => void;
	savePending: boolean;
	onSave: (
		calendars: Array<{ googleCalendarId: string; label: string }>
	) => void;
};

const OverlayCalendarsSection: FC<OverlayCalendarsSectionProps> = (props) => {
	const {
		calendars,
		calendarsLoading,
		calendarsError,
		onCalendarsRetry,
		subscriptions,
		subscriptionsLoading,
		subscriptionsError,
		onSubscriptionsRetry,
		savePending,
		onSave
	} = props;

	const [selected, setSelected] = useState<Record<string, boolean>>({});
	const [labels, setLabels] = useState<Record<string, string>>({});

	useEffect(() => {
		if (!subscriptions) return;
		const nextSelected: Record<string, boolean> = {};
		const nextLabels: Record<string, string> = {};
		for (const sub of subscriptions) {
			nextSelected[sub.googleCalendarId] = true;
			nextLabels[sub.googleCalendarId] = sub.label;
		}
		setSelected(nextSelected);
		setLabels((prev) => ({ ...nextLabels, ...prev }));
	}, [subscriptions]);

	useEffect(() => {
		if (!calendars) return;
		setLabels((prev) => {
			const next = { ...prev };
			for (const cal of calendars) {
				if (!next[cal.id]) {
					next[cal.id] = cal.summary;
				}
			}
			return next;
		});
	}, [calendars]);

	const ready =
		!calendarsLoading &&
		!subscriptionsLoading &&
		!calendarsError &&
		!subscriptionsError;

	const selectedCount = useMemo(
		() => Object.values(selected).filter(Boolean).length,
		[selected]
	);

	return (
		<Card>
			<CardHeader>
				<CardTitle>Agendas para visualizar</CardTitle>
				<CardDescription>
					Agendas compartilhadas (ex.: consultório) aparecem na agenda do
					sistema só para leitura — ajudam a evitar conflito de salas/horários.
					Não viram atendimentos.
				</CardDescription>
			</CardHeader>
			<CardContent className="space-y-4">
				{(calendarsLoading || subscriptionsLoading) && <FormSkeleton />}
				{calendarsError && (
					<ErrorState
						message={calendarsError.message}
						onRetry={onCalendarsRetry}
					/>
				)}
				{subscriptionsError && (
					<ErrorState
						message={subscriptionsError.message}
						onRetry={onSubscriptionsRetry}
					/>
				)}
				{ready && (calendars?.length ?? 0) === 0 && (
					<p className="text-muted-foreground text-sm">
						Nenhuma agenda disponível na conta Google conectada.
					</p>
				)}
				{ready && calendars && calendars.length > 0 && (
					<ul className="space-y-3">
						{calendars.map((cal) => {
							const checked = Boolean(selected[cal.id]);
							return (
								<li
									key={cal.id}
									className="border-border flex flex-col gap-2 rounded-lg border p-3 sm:flex-row sm:items-center"
								>
									<label className="flex min-w-0 flex-1 cursor-pointer items-start gap-3">
										<input
											type="checkbox"
											className="mt-1 size-4 shrink-0"
											checked={checked}
											onChange={(e) =>
												setSelected((prev) => ({
													...prev,
													[cal.id]: e.target.checked
												}))
											}
										/>
										<span className="min-w-0">
											<span className="block truncate text-sm font-medium">
												{cal.summary}
												{cal.primary ? " (principal)" : ""}
											</span>
											<span className="text-muted-foreground block text-xs">
												{cal.accessRole || "reader"}
											</span>
										</span>
									</label>
									{checked && (
										<Input
											aria-label={`Rótulo para ${cal.summary}`}
											className="sm:max-w-56"
											value={labels[cal.id] ?? cal.summary}
											onChange={(e) =>
												setLabels((prev) => ({
													...prev,
													[cal.id]: e.target.value
												}))
											}
											placeholder="Rótulo na agenda"
										/>
									)}
								</li>
							);
						})}
					</ul>
				)}
				{ready && (
					<div className="flex flex-wrap items-center gap-3">
						<Button
							type="button"
							disabled={savePending}
							onClick={() =>
								onSave(
									(calendars ?? [])
										.filter((c) => selected[c.id])
										.map((c) => ({
											googleCalendarId: c.id,
											label: (labels[c.id] || c.summary).trim() || c.summary
										}))
								)
							}
						>
							{savePending
								? "Salvando…"
								: selectedCount > 0
									? `Salvar (${selectedCount})`
									: "Salvar (nenhuma)"}
						</Button>
						<p className="text-muted-foreground text-xs">
							Ao salvar, o sistema sincroniza e passa a receber atualizações do
							Google.
						</p>
					</div>
				)}
			</CardContent>
		</Card>
	);
};

export default OverlayCalendarsSection;
