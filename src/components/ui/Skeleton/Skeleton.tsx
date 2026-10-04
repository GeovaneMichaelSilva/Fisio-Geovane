import { cn } from "@/utils";

import type { FC, HTMLAttributes } from "react";

const Skeleton: FC<HTMLAttributes<HTMLDivElement>> = (props) => {
	const { className, ...restProps } = props;

	return (
		<div
			className={cn("bg-muted animate-pulse rounded-md", className)}
			{...restProps}
		/>
	);
};

export { Skeleton };
