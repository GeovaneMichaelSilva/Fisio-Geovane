"use client";

import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle
} from "@/components/ui/Card";
import { usePageTitle } from "@/hooks/usePageTitle";

type PlaceholderPageProps = {
	title: string;
	description: string;
	soon?: boolean;
};

export function PlaceholderPage({
	title,
	description,
	soon = false
}: PlaceholderPageProps) {
	usePageTitle(title);

	return (
		<div className="space-y-4">
			<div>
				<h1 className="text-2xl font-medium">{title}</h1>
				<p className="text-muted-foreground text-sm">{description}</p>
			</div>
			<Card>
				<CardHeader>
					<CardTitle>{soon ? "Em breve" : "Em construção"}</CardTitle>
					<CardDescription>
						{soon
							? "Esta área está no roadmap e ainda não foi implementada."
							: "Estrutura pronta — funcionalidade será implementada na sequência do MVP."}
					</CardDescription>
				</CardHeader>
				<CardContent>
					<p className="text-muted-foreground text-sm">
						Ver documentação em{" "}
						<code className="text-foreground">docs/mvp.md</code>.
					</p>
				</CardContent>
			</Card>
		</div>
	);
}
