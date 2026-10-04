"use client";

import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle
} from "@/components/ui/Card";

import type { FC, ReactNode } from "react";
import type { SessionDetail } from "../types";

type SessionAuditCardProps = {
	session: SessionDetail | undefined;
};

const SessionAuditCard: FC<SessionAuditCardProps> = (props) => {
	const { session } = props;

	let body: ReactNode;
	if (!session?.audits.length) {
		body = (
			<p className="text-muted-foreground text-sm">
				Nenhuma edição registrada ainda.
			</p>
		);
	} else {
		body = (
			<ul className="divide-border divide-y">
				{session.audits.map((a) => (
					<li key={a.id} className="py-2 text-sm">
						<p className="font-medium">{a.reason}</p>
						<p className="text-muted-foreground text-xs">
							{new Date(a.editedAt).toLocaleString("pt-BR")}
						</p>
					</li>
				))}
			</ul>
		);
	}

	return (
		<Card>
			<CardHeader>
				<CardTitle>Auditoria recente</CardTitle>
				<CardDescription>Append-only — sem exclusão.</CardDescription>
			</CardHeader>
			<CardContent>{body}</CardContent>
		</Card>
	);
};

export default SessionAuditCard;
