"use client";

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

import type { AgendaSession } from "./types";
import type { FC, HTMLAttributes } from "react";

import "react-big-calendar/lib/css/react-big-calendar.css";
import "react-big-calendar/lib/addons/dragAndDrop/styles.css";
import "./agenda-calendar.css";

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
	onSelectSlot: (slot: { date: string; time: string; durationMinutes: number }) => void;
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
			event: ({ event }: { event: AgendaCalendarEvent }) => (
				<span className="block truncate text-[11px] leading-tight font-medium">
					{event.title}
				</span>
			)
		}),
		[]
	);

	const eventPropGetter = useCallback((event: AgendaCalendarEvent) => {
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

	const handleInteraction = (args: EventInteractionArgs<AgendaCalendarEvent>) => {
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
				resizable
				popup
				allDayAccessor={() => false}
				step={15}
				timeslots={4}
				min={min}
				max={max}
				scrollToTime={scrollToTime}
				components={components}
				eventPropGetter={eventPropGetter}
				draggableAccessor={(event) => event.resource.status === "scheduled"}
				resizableAccessor={(event) => event.resource.status === "scheduled"}
				onSelectSlot={handleSelectSlot}
				onSelectEvent={(event) => {
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
