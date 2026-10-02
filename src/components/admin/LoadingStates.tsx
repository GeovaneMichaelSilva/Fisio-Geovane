import { Skeleton } from "@/components/ui/Skeleton";
import { cn } from "@/utils";

type ListSkeletonProps = {
	rows?: number;
	rowClassName?: string;
	className?: string;
};

/**
 * Skeleton de lista (pacientes, sessões, etc.).
 */
export function ListSkeleton({
	rows = 3,
	rowClassName = "h-14 w-full",
	className
}: ListSkeletonProps) {
	return (
		<div className={cn("space-y-2", className)}>
			{Array.from({ length: rows }).map((_, i) => (
				<Skeleton key={i} className={rowClassName} />
			))}
		</div>
	);
}

type FormSkeletonProps = {
	fields?: number;
	className?: string;
};

/**
 * Skeleton de formulário.
 */
export function FormSkeleton({ fields = 3, className }: FormSkeletonProps) {
	return (
		<div className={cn("space-y-3", className)}>
			{Array.from({ length: fields }).map((_, i) => (
				<Skeleton
					key={i}
					className={i === fields - 1 ? "h-10 w-2/3" : "h-10 w-full"}
				/>
			))}
		</div>
	);
}
