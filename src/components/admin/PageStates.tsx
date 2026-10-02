import { Button } from "@/components/ui/Button";
import { cn } from "@/utils";

type PageHeaderProps = {
	title: string;
	description?: string;
	actions?: React.ReactNode;
	className?: string;
};

/**
 * Cabeçalho padrão das páginas admin.
 */
export function PageHeader({
	title,
	description,
	actions,
	className
}: PageHeaderProps) {
	return (
		<div
			className={cn(
				"flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between",
				className
			)}
		>
			<div className="min-w-0 space-y-1">
				<h1 className="text-2xl font-medium">{title}</h1>
				{description ? (
					<p className="text-muted-foreground text-sm">{description}</p>
				) : null}
			</div>
			{actions ? (
				<div className="flex flex-wrap gap-2">{actions}</div>
			) : null}
		</div>
	);
}

type EmptyStateProps = {
	title: string;
	description?: string;
	action?: React.ReactNode;
	className?: string;
};

/**
 * Estado vazio com CTA opcional.
 */
export function EmptyState({
	title,
	description,
	action,
	className
}: EmptyStateProps) {
	return (
		<div
			className={cn(
				"border-border bg-muted/40 flex flex-col items-start gap-3 rounded-lg border border-dashed p-6",
				className
			)}
		>
			<div className="space-y-1">
				<p className="text-sm font-medium">{title}</p>
				{description ? (
					<p className="text-muted-foreground text-sm">{description}</p>
				) : null}
			</div>
			{action}
		</div>
	);
}

type ErrorStateProps = {
	message: string;
	onRetry?: () => void;
	className?: string;
};

/**
 * Erro de carregamento com retry.
 */
export function ErrorState({ message, onRetry, className }: ErrorStateProps) {
	return (
		<div
			className={cn(
				"border-destructive/30 bg-destructive/5 flex flex-col items-start gap-3 rounded-lg border p-4",
				className
			)}
			role="alert"
		>
			<p className="text-destructive text-sm">{message}</p>
			{onRetry ? (
				<Button type="button" variant="outline" size="sm" onClick={onRetry}>
					Tentar de novo
				</Button>
			) : null}
		</div>
	);
}
