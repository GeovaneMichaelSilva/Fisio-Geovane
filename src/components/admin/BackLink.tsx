import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { cn } from "@/utils";

import type { FC } from "react";

type BackLinkProps = {
	href: string;
	/** Acessível — o botão é só ícone */
	label?: string;
	className?: string;
};

/**
 * Voltar à lista/pai — ícone à esquerda do título, separado das ações.
 */
const BackLink: FC<BackLinkProps> = (props) => {
	const { href, label = "Voltar", className } = props;

	return (
		<Button
			asChild
			variant="ghost"
			size="icon-default"
			className={cn("text-muted-foreground shrink-0", className)}
		>
			<Link href={href} aria-label={label} title={label}>
				<ArrowLeft />
			</Link>
		</Button>
	);
};

export default BackLink;
