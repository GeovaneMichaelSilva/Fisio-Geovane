"use client";

import EmptyState from "@/components/admin/EmptyState";
import { Button } from "@/components/ui/Button";
import {
	parseDateString,
	toDateString,
	WEEKDAY_LABELS
} from "@/lib/sessions/agenda";
import { cn } from "@/utils";

import SessionCard from "./SessionCard";

import type { AgendaSession } from "./types";
import type { FC, HTMLAttributes, ReactNode } from "react";

type AgendaWeekBoardProps = HTMLAttributes<HTMLDivElement> & {
	days: Date[];
	todayStr: string;
	selectedDay: string;
	sessionsByDay: Map<string, AgendaSession[]>;
	onSelectDay: (dateStr: string) => void;
	onOpenComposer: (dateStr: string) => void;
};

const AgendaWeekBoard: FC<AgendaWeekBoardProps> = (props) => {
	const {
		days,
		todayStr,
		selectedDay,
		sessionsByDay,
		onSelectDay,
		onOpenComposer,
		className,
		...restProps
	} = props;

	const mobileDaySessions = sessionsByDay.get(selectedDay) ?? [];

	let mobileList: ReactNode = (
		<EmptyState
			title="Sem horários neste dia"
			description="Toque em + Neste dia para agendar."
		/>
	);
	if (mobileDaySessions.length > 0) {
		mobileList = (
			<ul className="space-y-2">
				{mobileDaySessions.map((session) => (
					<li key={session.id}>
						<SessionCard session={session} />
					</li>
				))}
			</ul>
		);
	}

	return (
		<div className={cn("space-y-4", className)} {...restProps}>
			<div className="space-y-4 md:hidden">
				<div className="grid grid-cols-7 gap-1">
					{days.map((day, index) => {
						const dateStr = toDateString(day);
						const count = sessionsByDay.get(dateStr)?.length ?? 0;
						const isSelected = dateStr === selectedDay;
						const isToday = dateStr === todayStr;
						const selectedClass = isSelected
							? "border-brand bg-brand/10 text-foreground"
							: "border-border bg-card";
						const todayClass =
							isToday && !isSelected ? "border-brand/50" : undefined;

						return (
							<button
								key={dateStr}
								type="button"
								onClick={() => onSelectDay(dateStr)}
								className={cn(
									"flex min-h-14 flex-col items-center justify-center rounded-lg border px-0.5 py-1 text-center transition-colors",
									selectedClass,
									todayClass
								)}
							>
								<span className="text-muted-foreground text-[10px] uppercase">
									{WEEKDAY_LABELS[index].slice(0, 3)}
								</span>
								<span className="text-sm font-medium">{day.getDate()}</span>
								<span
									className={cn(
										"mt-0.5 size-1.5",
										count > 0 ? "bg-brand rounded-full" : undefined
									)}
								/>
							</button>
						);
					})}
				</div>

				<div className="flex items-center justify-between gap-2">
					<p className="text-sm font-medium">
						{parseDateString(selectedDay).toLocaleDateString("pt-BR", {
							weekday: "long",
							day: "2-digit",
							month: "long"
						})}
					</p>
					<Button
						type="button"
						size="sm"
						variant="outline"
						className="min-h-11"
						onClick={() => onOpenComposer(selectedDay)}
					>
						+ Neste dia
					</Button>
				</div>

				{mobileList}
			</div>

			<div className="hidden gap-3 md:grid md:grid-cols-7">
				{days.map((day, index) => {
					const dateStr = toDateString(day);
					const items = sessionsByDay.get(dateStr) ?? [];
					const isToday = dateStr === todayStr;

					let dayBody: ReactNode = (
						<p className="text-muted-foreground px-1 text-xs">Sem horários</p>
					);
					if (items.length > 0) {
						dayBody = items.map((session) => (
							<SessionCard key={session.id} session={session} />
						));
					}

					return (
						<section
							key={dateStr}
							className={cn(
								"border-border bg-card flex min-h-48 flex-col rounded-xl border",
								isToday && "border-brand border-2"
							)}
						>
							<button
								type="button"
								className="hover:bg-accent/40 border-border border-b px-2 py-2 text-left"
								onClick={() => onOpenComposer(dateStr)}
							>
								<p className="text-muted-foreground text-xs tracking-wide uppercase">
									{WEEKDAY_LABELS[index]}
								</p>
								<p className="text-sm font-medium">
									{day.toLocaleDateString("pt-BR", {
										day: "2-digit",
										month: "2-digit"
									})}
								</p>
							</button>
							<div className="flex flex-1 flex-col gap-2 p-2">{dayBody}</div>
						</section>
					);
				})}
			</div>
		</div>
	);
};

export default AgendaWeekBoard;
