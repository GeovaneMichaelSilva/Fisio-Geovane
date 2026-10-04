import { Button } from "@/components/ui/Button";
import { cn } from "@/utils";

import type { FC, HTMLAttributes, ReactNode } from "react";

type ErrorStateProps = HTMLAttributes<HTMLDivElement> & {
	message: string;
	onRetry?: () => void;
};

/**
 * Erro de carregamento com retry.
 */
const ErrorState: FC<ErrorStateProps> = (props) => {
	const { message, onRetry, className, ...restProps } = props;

	let retryNode: ReactNode = null;
	if (onRetry) {
		retryNode = (
			<Button type="button" variant="outline" size="sm" onClick={onRetry}>
				Tentar de novo
			</Button>
		);
	}

	return (
		<div
			className={cn(
				"border-destructive/30 bg-destructive/5 flex flex-col items-start gap-3 rounded-lg border p-4",
				className
			)}
			role="alert"
			{...restProps}
		>
			<p className="text-destructive text-sm">{message}</p>
			{retryNode}
		</div>
	);
};

export default ErrorState;
