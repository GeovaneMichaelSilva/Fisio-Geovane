"use client";

import Link from "next/link";

import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { normalizeTime, STATUS_LABEL } from "@/lib/sessions/agenda";
import { cn } from "@/utils";

import { statusVariant } from "./agendaApi";

import type { AgendaSession } from "./types";
import type { FC, HTMLAttributes, ReactNode } from "react";

type SessionCardProps = HTMLAttributes<HTMLDivElement> & {
	session: AgendaSession;
};

const SessionCard: FC<SessionCardProps> = (props) => {
	const { session, className, ...restProps } = props;

	let startButton: ReactNode = null;
	if (session.status === "scheduled") {
		startButton = (
			<Button asChild size="sm" className="mt-2 min-h-11 w-full sm:min-h-9">
				<Link href={`/admin/sessions/${session.id}?mode=clinical`}>INICIAR</Link>
			</Button>
		);
	}

	return (
		<div
			className={cn(
				"border-border hover:border-brand border-l-brand rounded-md border border-l-4 bg-white p-3 shadow-xs transition-colors",
				className
			)}
			{...restProps}
		>
			<Link href={`/admin/sessions/${session.id}`} className="block">
				<p className="text-xs font-medium">
					{normalizeTime(String(session.scheduledTime)).slice(0, 5)} ·{" "}
					{session.durationMinutes}min
				</p>
				<p className="truncate text-sm font-medium">{session.patientName}</p>
				<p className="text-muted-foreground truncate text-xs">
					{session.serviceTypeName}
				</p>
				<div className="mt-1 flex flex-wrap gap-1">
					<Badge variant={statusVariant(session.status)}>
						{STATUS_LABEL[session.status] ?? session.status}
					</Badge>
				</div>
			</Link>
			{startButton}
		</div>
	);
};

export default SessionCard;
