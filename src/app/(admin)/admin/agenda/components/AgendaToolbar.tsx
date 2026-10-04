"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/Button";
import {
	addDays,
	addMonths,
	startOfMonth,
	startOfWeekMonday
} from "@/lib/sessions/agenda";
import { cn } from "@/utils";

import type { View } from "react-big-calendar";
import type { FC, HTMLAttributes } from "react";

type AgendaToolbarProps = HTMLAttributes<HTMLDivElement> & {
	view: View;
	date: Date;
	onViewChange: (view: View) => void;
	onDateChange: (next: Date) => void;
};

const viewButtons: Array<{ id: View; label: string }> = [
	{ id: "week", label: "Semana" },
	{ id: "month", label: "Mês" },
	{ id: "day", label: "Dia" }
];

/**
 * Barra do calendário: modo de visualização à esquerda, navegação à direita.
 */
const AgendaToolbar: FC<AgendaToolbarProps> = (props) => {
	const {
		view,
		date,
		onViewChange,
		onDateChange,
		className,
		...restProps
	} = props;

	const goToday = () => {
		onDateChange(new Date());
	};

	const goPrev = () => {
		if (view === "month") {
			onDateChange(addMonths(startOfMonth(date), -1));
			return;
		}
		if (view === "day") {
			onDateChange(addDays(date, -1));
			return;
		}
		onDateChange(addDays(startOfWeekMonday(date), -7));
	};

	const goNext = () => {
		if (view === "month") {
			onDateChange(addMonths(startOfMonth(date), 1));
			return;
		}
		if (view === "day") {
			onDateChange(addDays(date, 1));
			return;
		}
		onDateChange(addDays(startOfWeekMonday(date), 7));
	};

	return (
		<div
			className={cn(
				"flex flex-wrap items-center justify-between gap-3",
				className
			)}
			{...restProps}
		>
			<div
				className="border-border bg-card flex rounded-md border p-0.5"
				role="group"
				aria-label="Visualização da agenda"
			>
				{viewButtons.map((item) => {
					const activeClass =
						view === item.id
							? "bg-primary text-primary-foreground"
							: "text-muted-foreground hover:text-foreground";
					return (
						<button
							key={item.id}
							type="button"
							onClick={() => onViewChange(item.id)}
							className={cn(
								"rounded px-2.5 py-1.5 text-xs font-medium transition-colors sm:text-sm",
								activeClass
							)}
						>
							{item.label}
						</button>
					);
				})}
			</div>

			<div
				className="flex items-center gap-1.5"
				role="group"
				aria-label="Navegação do período"
			>
				<Button
					type="button"
					variant="outline"
					size="icon-sm"
					className="min-h-11 min-w-11 sm:min-h-9 sm:min-w-9"
					onClick={goPrev}
					aria-label="Anterior"
				>
					<ChevronLeft />
				</Button>
				<Button
					type="button"
					variant="secondary"
					size="sm"
					className="min-h-11 px-3 sm:min-h-9"
					onClick={goToday}
				>
					Hoje
				</Button>
				<Button
					type="button"
					variant="outline"
					size="icon-sm"
					className="min-h-11 min-w-11 sm:min-h-9 sm:min-w-9"
					onClick={goNext}
					aria-label="Próximo"
				>
					<ChevronRight />
				</Button>
			</div>
		</div>
	);
};

export default AgendaToolbar;
