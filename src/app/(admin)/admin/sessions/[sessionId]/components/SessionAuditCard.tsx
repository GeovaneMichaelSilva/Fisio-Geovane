"use client";

import { AdminList, AdminListItem } from "@/components/admin/AdminList";
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
			<AdminList>
				{session.audits.map((a) => (
					<AdminListItem key={a.id} className="sm:flex-col sm:items-start">
						<p className="text-sm font-medium">{a.reason}</p>
						<p className="text-muted-foreground text-xs">
							{new Date(a.editedAt).toLocaleString("pt-BR")}
						</p>
					</AdminListItem>
				))}
			</AdminList>
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
