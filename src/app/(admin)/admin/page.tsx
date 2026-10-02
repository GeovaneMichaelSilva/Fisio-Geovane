import Link from "next/link";

import { Button } from "@/components/ui/Button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle
} from "@/components/ui/Card";

const tiles = [
	{
		href: "/admin/agenda",
		title: "Agenda",
		description: "Horários, agendamentos e retornos"
	},
	{
		href: "/admin/patients",
		title: "Pacientes",
		description: "Dados pessoais e cadastros"
	},
	{
		href: "/admin/finance",
		title: "Financeiro",
		description: "Pagamentos, pendências e notas"
	},
	{
		href: "/admin/records",
		title: "Atendimentos",
		description: "Avaliações, evoluções e atividades"
	}
];

export const metadata = {
	title: "Início"
};

export default function AdminHomePage() {
	return (
		<div className="space-y-6">
			<div>
				<h1 className="text-2xl font-medium">Seu espaço de trabalho</h1>
				<p className="text-muted-foreground text-sm">
					Selecione uma área para começar.
				</p>
			</div>
			<div className="grid gap-4 sm:grid-cols-2">
				{tiles.map((tile) => (
					<Card
						key={tile.href}
						className="hover:border-brand transition-colors"
					>
						<CardHeader>
							<CardTitle>{tile.title}</CardTitle>
							<CardDescription>{tile.description}</CardDescription>
						</CardHeader>
						<CardContent>
							<Button asChild variant="secondary">
								<Link href={tile.href}>Abrir</Link>
							</Button>
						</CardContent>
					</Card>
				))}
			</div>
		</div>
	);
}
