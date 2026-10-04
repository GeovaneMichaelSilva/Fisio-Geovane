import { Skeleton } from "@/components/ui/Skeleton";
import { cn } from "@/utils";

import type { ComponentPropsWithoutRef, FC } from "react";

type ListSkeletonProps = {
	rows?: number;
	rowClassName?: string;
	className?: string;
} & ComponentPropsWithoutRef<"div">;

/**
 * Skeleton de lista (pacientes, sessões, etc.).
 */
const ListSkeleton: FC<ListSkeletonProps> = (props) => {
	const { rows = 3, rowClassName = "h-14 w-full", className, ...restProps } =
		props;

	return (
		<div className={cn("space-y-2", className)} {...restProps}>
			{Array.from({ length: rows }).map((_, i) => (
				<Skeleton key={i} className={rowClassName} />
			))}
		</div>
	);
};

type FormSkeletonProps = {
	fields?: number;
	className?: string;
} & ComponentPropsWithoutRef<"div">;

/**
 * Skeleton de formulário.
 */
const FormSkeleton: FC<FormSkeletonProps> = (props) => {
	const { fields = 3, className, ...restProps } = props;

	return (
		<div className={cn("space-y-3", className)} {...restProps}>
			{Array.from({ length: fields }).map((_, i) => (
				<Skeleton
					key={i}
					className={i === fields - 1 ? "h-10 w-2/3" : "h-10 w-full"}
				/>
			))}
		</div>
	);
};

export { FormSkeleton, ListSkeleton };
