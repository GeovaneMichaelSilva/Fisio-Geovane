"use client";

import Link from "next/link";

import { Button } from "@/components/ui/Button";

import type { GoogleStatus } from "./types";
import type { FC, HTMLAttributes, ReactNode } from "react";

type AgendaHeaderActionsProps = HTMLAttributes<HTMLDivElement> & {
	googleStatus?: GoogleStatus;
	onSchedule: () => void;
};

/**
 * Ações do PageHeader da agenda: status Google + CTA principal.
 */
const AgendaHeaderActions: FC<AgendaHeaderActionsProps> = (props) => {
	const { googleStatus, onSchedule, className, ...restProps } = props;

	let googleStatusNode: ReactNode = null;
	if (googleStatus?.configured && !googleStatus.connected) {
		googleStatusNode = (
			<Link
				href="/admin/settings/integrations"
				className="text-destructive order-last w-full text-right text-xs underline-offset-2 hover:underline sm:order-first sm:w-auto"
			>
				Google Agenda desconectada
			</Link>
		);
	}

	return (
		<div
			className={className}
			{...restProps}
		>
			<div className="flex flex-wrap items-center justify-end gap-2">
				{googleStatusNode}
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
