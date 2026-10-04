"use client";

import Link from "next/link";

import { Button } from "@/components/ui/Button";
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
			<div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
				<div>
					<h1 className="text-2xl font-medium">Despesas</h1>
					<p className="text-muted-foreground text-sm">
						Controle de caixa e despesas da clínica.
					</p>
				</div>
				<Button asChild variant="outline">
					<Link href="/admin/finance">Voltar ao financeiro</Link>
				</Button>
			</div>

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
