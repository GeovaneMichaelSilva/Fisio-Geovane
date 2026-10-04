import { cn } from "@/utils";

import type { FC, HTMLAttributes, ReactNode } from "react";

type PageHeaderProps = HTMLAttributes<HTMLDivElement> & {
	title: string;
	description?: string;
	actions?: ReactNode;
};

/**
 * Cabeçalho padrão das páginas admin.
 */
const PageHeader: FC<PageHeaderProps> = (props) => {
	const { title, description, actions, className, ...restProps } = props;

	let descriptionNode: ReactNode = null;
	if (description) {
		descriptionNode = (
			<p className="text-muted-foreground text-sm">{description}</p>
		);
	}

	let actionsNode: ReactNode = null;
	if (actions) {
		actionsNode = <div className="flex flex-wrap gap-2">{actions}</div>;
	}

	return (
		<div
			className={cn(
				"flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between",
				className
			)}
			{...restProps}
		>
			<div className="min-w-0 space-y-1">
				<h1 className="text-2xl font-medium">{title}</h1>
				{descriptionNode}
			</div>
			{actionsNode}
		</div>
	);
};

export default PageHeader;
