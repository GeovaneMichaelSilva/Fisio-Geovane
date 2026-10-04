"use client";

import { PageHeader } from "@/components/admin/PageStates";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle
} from "@/components/ui/Card";
import { usePageTitle } from "@/hooks/usePageTitle";

import type { FC } from "react";

const ExpensesPage: FC = () => {
	usePageTitle("Despesas");

	return (
		<div className="space-y-6">
			<PageHeader
				title="Despesas"
				description="Controle de caixa e despesas da clínica."
				backHref="/admin/finance"
				backLabel="Voltar ao financeiro"
			/>

			<Card>
				<CardHeader>
					<CardTitle>Em breve</CardTitle>
					<CardDescription>
						Despesas/caixa não fazem parte do MVP — ficam no roadmap.
					</CardDescription>
				</CardHeader>
				<CardContent>
					<p className="text-muted-foreground text-sm">
						Por enquanto use o financeiro para recebimentos de sessões
						realizadas (pago, data e NFS-e).
					</p>
				</CardContent>
			</Card>
		</div>
	);
};

export default ExpensesPage;
