"use client";

import { cn } from "@/utils";
import * as SeparatorPrimitive from "@radix-ui/react-separator";

import type { ComponentPropsWithoutRef } from "react";

type SeparatorProps = ComponentPropsWithoutRef<typeof SeparatorPrimitive.Root>;

function Separator({
	className,
	orientation = "horizontal",
	decorative = true,
	...props
}: SeparatorProps) {
	return (
		<SeparatorPrimitive.Root
			decorative={decorative}
			orientation={orientation}
			className={cn(
				"bg-border shrink-0",
				orientation === "horizontal" ? "h-px w-full" : "h-full w-px",
				className
			)}
			{...props}
		/>
	);
}

export { Separator };
export type { SeparatorProps };
