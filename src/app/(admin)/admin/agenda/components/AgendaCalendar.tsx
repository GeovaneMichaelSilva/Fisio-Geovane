"use client";

import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useMemo, useCallback } from "react";
import { Calendar, Views, type View, type SlotInfo } from "react-big-calendar";
import withDragAndDrop, {
	type EventInteractionArgs
} from "react-big-calendar/lib/addons/dragAndDrop";
import { useRouter } from "next/navigation";

import { cn } from "@/utils";

import { agendaLocalizer, agendaMessages } from "./agendaCalendarLocalizer";
import {
	durationBetweenMinutes,
	formatTimeHHMM,
	toLocalDateString,
	type AgendaCalendarEvent
} from "./agendaEvents";
import { isExternalAgendaEvent } from "./types";

import type { AgendaSession } from "./types";
import type { FC, HTMLAttributes } from "react";

import "react-big-calendar/lib/css/react-big-calendar.css";
import "react-big-calendar/lib/addons/dragAndDrop/styles.css";
import "./agenda-calendar.css";

const weekdayInitial = (date: Date) =>
	format(date, "EEEEE", { locale: ptBR }).toUpperCase();

const DnDCalendar = withDragAndDrop<AgendaCalendarEvent>(Calendar);

export type AgendaRescheduleTarget = {
	session: AgendaSession;
	toDate: string;
	toTime: string;
	durationMinutes: number;
};

type AgendaCalendarProps = HTMLAttributes<HTMLDivElement> & {
	date: Date;
	view: View;
	events: AgendaCalendarEvent[];
	onNavigate: (date: Date) => void;
	onView: (view: View) => void;
	onSelectSlot: (slot: {
		date: string;
		time: string;
		durationMinutes: number;
	}) => void;
	onRequestReschedule: (target: AgendaRescheduleTarget) => void;
};

const AgendaCalendar: FC<AgendaCalendarProps> = (props) => {
	const {
		date,
		view,
		events,
		onNavigate,
		onView,
		onSelectSlot,
		onRequestReschedule,
		className,
		...restProps
	} = props;

	const router = useRouter();

	const components = useMemo(
		() => ({
			toolbar: () => null,
			/** Semana: inicial do dia + número, centralizados. Mês usa weekdayFormat. */
			header:
				view === Views.WEEK
					? ({ date }: { date: Date }) => (
							<div className="agenda-calendar-week-header">
								<span className="agenda-calendar-week-header__dow">
									{weekdayInitial(date)}
								</span>
								<span className="agenda-calendar-week-header__day">
									{format(date, "d")}
								</span>
							</div>
						)
					: undefined,
			event: ({ event }: { event: AgendaCalendarEvent }) => {
				const name = event.resource.patientName;
				/**
				 * Mobile: corta o texto sem reticências — "..." gasta espaço
				 * que poderia mostrar mais uma letra do nome.
				 */
				const lineClass =
					"overflow-hidden whitespace-nowrap md:truncate";

				/** Semana: só o nome — a hora já está na grade à esquerda. */
				if (view === Views.WEEK) {
					return (
						<div className="min-w-0 overflow-hidden text-[11px] leading-tight">
							<p className={cn(lineClass, "font-medium")}>{name}</p>
						</div>
					);
				}

				if (isExternalAgendaEvent(event.resource)) {
					const prefix = event.allDay
						? "Dia todo"
						: formatTimeHHMM(event.start);
					return (
						<div className="overflow-hidden text-[11px] leading-tight">
							<p className={cn(lineClass, "font-medium")}>
								{prefix} · {name}
							</p>
							<p className={cn(lineClass, "opacity-80")}>
								{event.resource.serviceTypeName}
							</p>
						</div>
					);
				}

				const showDetails = event.resource.durationMinutes >= 90;
				return (
					<div className="overflow-hidden text-[11px] leading-tight">
						<p className={cn(lineClass, "font-medium")}>
							{formatTimeHHMM(event.start)} · {name}
						</p>
						{showDetails && (
							<p className={cn(lineClass, "opacity-80")}>
								{formatTimeHHMM(event.end)}
								{event.resource.serviceTypeName
									? ` · ${event.resource.serviceTypeName}`
									: ""}
							</p>
						)}
					</div>
				);
			}
		}),
		[view]
	);

	const formats = useMemo(
		() => ({
			eventTimeRangeFormat: () => "",
			eventTimeRangeStartFormat: () => "",
			eventTimeRangeEndFormat: () => "",
			/** Mês: só a inicial do dia da semana. */
			weekdayFormat: (date: Date) => weekdayInitial(date)
		}),
		[]
	);

	const eventPropGetter = useCallback((event: AgendaCalendarEvent) => {
		if (isExternalAgendaEvent(event.resource)) {
			return { className: "rbc-event--external" };
		}
		const status = event.resource.status;
		let className = "rbc-event--scheduled";
		if (status === "completed") className = "rbc-event--completed";
		else if (status === "canceled") className = "rbc-event--canceled";
		else if (status === "no_show") className = "rbc-event--no-show";
		return { className };
	}, []);

	const handleSelectSlot = (slot: SlotInfo) => {
		const start = new Date(slot.start);
		const end = new Date(slot.end);
		onSelectSlot({
			date: toLocalDateString(start),
			time: formatTimeHHMM(start),
			durationMinutes: durationBetweenMinutes(start, end)
		});
	};

	const handleInteraction = (
		args: EventInteractionArgs<AgendaCalendarEvent>
	) => {
		if (isExternalAgendaEvent(args.event.resource)) return;
		const session = args.event.resource;
		if (session.status !== "scheduled") return;

		const start = new Date(args.start);
		const end = new Date(args.end);
		const toDate = toLocalDateString(start);
		const toTime = formatTimeHHMM(start);
		const durationMinutes = durationBetweenMinutes(start, end);
		const prevTime = String(session.scheduledTime).slice(0, 5);

		if (
			toDate === session.scheduledDate &&
			toTime === prevTime &&
			durationMinutes === session.durationMinutes
		) {
			return;
		}

		onRequestReschedule({
			session,
			toDate,
			toTime,
			durationMinutes
		});
	};

	const min = useMemo(() => new Date(1970, 0, 1, 7, 0, 0), []);
	const max = useMemo(() => new Date(1970, 0, 1, 21, 0, 0), []);
	const scrollToTime = useMemo(() => new Date(1970, 0, 1, 8, 0, 0), []);

	return (
		<div
			className={cn(
				"agenda-calendar border-border bg-card overflow-hidden rounded-xl border",
				`agenda-calendar--${view}`,
				className
			)}
			{...restProps}
		>
			<DnDCalendar
				localizer={agendaLocalizer}
				culture="pt-BR"
				messages={agendaMessages}
				date={date}
				view={view}
				onNavigate={onNavigate}
				onView={onView}
				events={events}
				startAccessor="start"
				endAccessor="end"
				titleAccessor="title"
				views={[Views.MONTH, Views.WEEK, Views.DAY]}
				selectable
				resizable={view !== Views.MONTH}
				popup
				allDayAccessor={(event) => Boolean(event.allDay)}
				step={15}
				timeslots={4}
				min={min}
				max={max}
				scrollToTime={scrollToTime}
				components={components}
				formats={formats}
				eventPropGetter={eventPropGetter}
				draggableAccessor={(event) =>
					!isExternalAgendaEvent(event.resource) &&
					event.resource.status === "scheduled"
				}
				resizableAccessor={(event) =>
					view !== Views.MONTH &&
					!isExternalAgendaEvent(event.resource) &&
					event.resource.status === "scheduled"
				}
				onSelectSlot={handleSelectSlot}
				onSelectEvent={(event) => {
					if (isExternalAgendaEvent(event.resource)) return;
					router.push(`/admin/sessions/${event.resource.id}`);
				}}
				onEventDrop={handleInteraction}
				onEventResize={handleInteraction}
				style={{ height: "100%" }}
			/>
		</div>
	);
};

export default AgendaCalendar;
