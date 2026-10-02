"use client";

import { SettingsNav } from "@/components/admin/SettingsNav";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle
} from "@/components/ui/Card";
import { usePageTitle } from "@/hooks/usePageTitle";

export default function IntegrationsPage() {
	usePageTitle("Integrações");

	return (
		<div className="space-y-6">
			<div className="space-y-3">
				<div>
					<h1 className="text-2xl font-medium">Integrações</h1>
					<p className="text-muted-foreground text-sm">
						Conexões externas — roadmap pós-MVP.
					</p>
				</div>
				<SettingsNav />
			</div>

			<Card>
				<CardHeader>
					<CardTitle>Google Agenda</CardTitle>
					<CardDescription>Em breve</CardDescription>
				</CardHeader>
				<CardContent>
					<p className="text-muted-foreground text-sm">
						Sincronização com Google Agenda está prevista como prioridade alta
						após o MVP.
					</p>
				</CardContent>
			</Card>
		</div>
	);
}
