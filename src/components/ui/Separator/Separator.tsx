"use client";

import { cn } from "@/utils";
import * as SeparatorPrimitive from "@radix-ui/react-separator";

import type { ComponentPropsWithoutRef, FC } from "react";

type SeparatorProps = ComponentPropsWithoutRef<typeof SeparatorPrimitive.Root>;

const Separator: FC<SeparatorProps> = (props) => {
	const {
		className,
		orientation = "horizontal",
		decorative = true,
		...restProps
	} = props;

	return (
		<SeparatorPrimitive.Root
			decorative={decorative}
			orientation={orientation}
			className={cn(
				"bg-border shrink-0",
				orientation === "horizontal" ? "h-px w-full" : "h-full w-px",
				className
			)}
			{...restProps}
		/>
	);
};

export { Separator };
export type { SeparatorProps };
