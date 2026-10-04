import BackLink from "@/components/admin/BackLink";
import { cn } from "@/utils";

import type { FC, HTMLAttributes, ReactNode } from "react";

type PageHeaderProps = Omit<HTMLAttributes<HTMLDivElement>, "title"> & {
	title: ReactNode;
	description?: string;
	actions?: ReactNode;
	/** Se definido, mostra ícone de voltar à esquerda do título */
	backHref?: string;
	backLabel?: string;
};

/**
 * Cabeçalho padrão das páginas admin.
 * `backHref` fica à esquerda; `actions` à direita — não misturar "Voltar" nas ações.
 */
const PageHeader: FC<PageHeaderProps> = (props) => {
	const {
		title,
		description,
		actions,
		backHref,
		backLabel = "Voltar",
		className,
		...restProps
	} = props;

	return (
		<div
			className={cn(
				"flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between",
				className
			)}
			{...restProps}
		>
			<div className="flex min-w-0 items-start gap-1 sm:gap-2">
				{backHref && <BackLink href={backHref} label={backLabel} />}
				<div className="min-w-0 space-y-1">
					<h1 className="text-2xl font-medium">{title}</h1>
					{description && (
						<p className="text-muted-foreground text-sm">{description}</p>
					)}
				</div>
			</div>
			{actions && (
				<div className="flex flex-wrap gap-2 sm:justify-end">{actions}</div>
			)}
		</div>
	);
};

export default PageHeader;
