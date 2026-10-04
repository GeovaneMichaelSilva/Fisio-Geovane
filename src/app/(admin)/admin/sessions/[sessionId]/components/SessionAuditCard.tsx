"use client";

import { AdminList, AdminListItem } from "@/components/admin/AdminList";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle
} from "@/components/ui/Card";

import type { FC } from "react";
import type { SessionDetail } from "../types";

type SessionAuditCardProps = {
	session: SessionDetail | undefined;
};

const SessionAuditCard: FC<SessionAuditCardProps> = (props) => {
	const { session } = props;
	const audits = session?.audits ?? [];
	const hasAudits = audits.length > 0;

	return (
		<Card>
			<CardHeader>
				<CardTitle>Auditoria recente</CardTitle>
				<CardDescription>Append-only — sem exclusão.</CardDescription>
			</CardHeader>
			<CardContent>
				{!hasAudits && (
					<p className="text-muted-foreground text-sm">
						Nenhuma edição registrada ainda.
					</p>
				)}
				{hasAudits && (
					<AdminList>
						{audits.map((a) => (
							<AdminListItem
								key={a.id}
								className="sm:flex-col sm:items-start"
							>
								<p className="text-sm font-medium">{a.reason}</p>
								<p className="text-muted-foreground text-xs">
									{new Date(a.editedAt).toLocaleString("pt-BR")}
								</p>
							</AdminListItem>
						))}
					</AdminList>
				)}
			</CardContent>
		</Card>
	);
};

export default SessionAuditCard;
