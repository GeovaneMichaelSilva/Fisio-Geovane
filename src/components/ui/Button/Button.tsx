import { forwardRef } from "react";

import { cn } from "@/utils";
import { Slot } from "@radix-ui/react-slot";

import { buttonVariants } from "./variants";

import type { VariantProps } from "class-variance-authority";

export interface ButtonProps
	extends
		Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "color">,
		VariantProps<typeof buttonVariants> {
	asChild?: boolean;
	visuallyDisabled?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>((props, ref) => {
	const {
		className,
		variant,
		color,
		size,
		asChild = false,
		disabled,
		visuallyDisabled = false,
		tabIndex,
		children,
		...restProps
	} = props;
	const Comp = asChild ? Slot : "button";

	return (
		<Comp
			ref={ref}
			className={cn(buttonVariants({ variant, color, size, className }))}
			tabIndex={visuallyDisabled ? -1 : tabIndex}
			data-visually-disabled={visuallyDisabled}
			disabled={disabled}
			{...restProps}
		>
			{children}
		</Comp>
	);
});
Button.displayName = "Button";

export { Button };
