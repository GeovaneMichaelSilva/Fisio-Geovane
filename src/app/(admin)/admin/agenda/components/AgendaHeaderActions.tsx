"use client";

import { Button } from "@/components/ui/Button";
import {
	addDays,
	startOfWeekMonday,
	toDateString
} from "@/lib/sessions/agenda";

import type { GoogleStatus } from "./types";
import type { FC, HTMLAttributes, ReactNode } from "react";

type AgendaHeaderActionsProps = HTMLAttributes<HTMLDivElement> & {
	monday: Date;
	googleStatus?: GoogleStatus;
	onWeekAnchorChange: (next: Date) => void;
	onSelectedDayChange: (dateStr: string) => void;
	onSchedule: () => void;
};

const AgendaHeaderActions: FC<AgendaHeaderActionsProps> = (props) => {
	const {
		monday,
		googleStatus,
		onWeekAnchorChange,
		onSelectedDayChange,
		onSchedule,
		className,
		...restProps
	} = props;

	let googleStatusNode: ReactNode = null;
	if (googleStatus?.connected) {
		googleStatusNode = (
			<p className="text-muted-foreground hidden text-xs sm:block">
				Google Agenda conectada
			</p>
		);
	} else if (googleStatus?.configured) {
		googleStatusNode = (
			<p className="text-muted-foreground hidden text-xs sm:block">
				Google Agenda desconectada
			</p>
		);
	}

	return (
		<div className={className} {...restProps}>
			<div className="flex flex-wrap items-center gap-2">
				{googleStatusNode}
				<div className="flex flex-wrap items-center gap-2">
					<Button
						type="button"
						variant="outline"
						size="sm"
						className="min-h-11 sm:min-h-9"
						onClick={() => onWeekAnchorChange(addDays(monday, -7))}
					>
						Anterior
					</Button>
					<Button
						type="button"
						variant="secondary"
						size="sm"
						className="min-h-11 sm:min-h-9"
						onClick={() => {
							const now = new Date();
							onWeekAnchorChange(startOfWeekMonday(now));
							onSelectedDayChange(toDateString(now));
						}}
					>
						Hoje
					</Button>
					<Button
						type="button"
						variant="outline"
						size="sm"
						className="min-h-11 sm:min-h-9"
						onClick={() => onWeekAnchorChange(addDays(monday, 7))}
					>
						Próxima
					</Button>
				</div>
				<Button
					type="button"
					className="min-h-11 w-full sm:min-h-10 sm:w-auto"
					onClick={onSchedule}
				>
					+ Agendar
				</Button>
			</div>
		</div>
	);
};

export default AgendaHeaderActions;
