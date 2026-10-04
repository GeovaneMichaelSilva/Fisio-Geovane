import { cn } from "@/utils";

import type { FC, HTMLAttributes, ReactNode } from "react";

type EmptyStateProps = HTMLAttributes<HTMLDivElement> & {
	title: string;
	description?: string;
	action?: ReactNode;
};

/**
 * Estado vazio com CTA opcional.
 */
const EmptyState: FC<EmptyStateProps> = (props) => {
	const { title, description, action, className, ...restProps } = props;

	let descriptionNode: ReactNode = null;
	if (description) {
		descriptionNode = (
			<p className="text-muted-foreground text-sm">{description}</p>
		);
	}

	return (
		<div
			className={cn(
				"border-border bg-muted/40 flex flex-col items-start gap-3 rounded-lg border border-dashed p-6",
				className
			)}
			{...restProps}
		>
			<div className="space-y-1">
				<p className="text-sm font-medium">{title}</p>
				{descriptionNode}
			</div>
			{action}
		</div>
	);
};

export default EmptyState;
