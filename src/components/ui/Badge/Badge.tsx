import { cva } from "class-variance-authority";

import { cn } from "@/utils";

import type { HTMLAttributes } from "react";
import type { VariantProps } from "class-variance-authority";

const badgeVariants = cva(
	cn(
		"inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium",
		"transition-colors"
	),
	{
		variants: {
			variant: {
				default: "border-transparent bg-primary text-primary-foreground",
				secondary: "border-transparent bg-secondary text-secondary-foreground",
				outline: "text-foreground",
				destructive:
					"border-transparent bg-destructive text-destructive-foreground"
			}
		},
		defaultVariants: {
			variant: "default"
		}
	}
);

type BadgeProps = HTMLAttributes<HTMLDivElement> &
	VariantProps<typeof badgeVariants>;

function Badge({ className, variant, ...props }: BadgeProps) {
	return (
		<div className={cn(badgeVariants({ variant }), className)} {...props} />
	);
}

export { Badge, badgeVariants };
export type { BadgeProps };
