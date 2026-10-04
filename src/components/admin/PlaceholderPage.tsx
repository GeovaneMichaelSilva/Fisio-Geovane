"use client";

import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle
} from "@/components/ui/Card";
import { usePageTitle } from "@/hooks/usePageTitle";

import type { ComponentPropsWithoutRef, FC } from "react";

type PlaceholderPageProps = {
	title: string;
	description: string;
	soon?: boolean;
} & ComponentPropsWithoutRef<"div">;

const PlaceholderPage: FC<PlaceholderPageProps> = (props) => {
	const { title, description, soon = false, ...restProps } = props;
	usePageTitle(title);

	const cardTitle = soon ? "Em breve" : "Em construção";
	const cardDescription = soon
		? "Esta área está no roadmap e ainda não foi implementada."
		: "Estrutura pronta — funcionalidade ainda não disponível.";

	return (
		<div className="space-y-4" {...restProps}>
			<div>
				<h1 className="text-2xl font-medium">{title}</h1>
				<p className="text-muted-foreground text-sm">{description}</p>
			</div>
			<Card>
				<CardHeader>
					<CardTitle>{cardTitle}</CardTitle>
					<CardDescription>{cardDescription}</CardDescription>
				</CardHeader>
				<CardContent>
					<p className="text-muted-foreground text-sm">
						Roadmap em <code className="text-foreground">docs/README.md</code>.
					</p>
				</CardContent>
			</Card>
		</div>
	);
};

export default PlaceholderPage;
