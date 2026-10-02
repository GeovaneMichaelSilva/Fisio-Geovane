import { forwardRef } from "react";

import { cn } from "@/utils";
import * as LabelPrimitive from "@radix-ui/react-label";

import { labelVariants, wrapperVariants } from "./variants";

import type { ComponentPropsWithoutRef, ReactNode } from "react";

export type LabelAttributes =
	| string
	| {
			text?: string;
			description?: string;
			required?: boolean | "optional";
	  };

type LabelProps = {
	label?: LabelAttributes;
	direction?: "row" | "row-reverse" | "column";
	error?: string | boolean;
	helperText?: string;
	children?: ReactNode;
	disabled?: boolean;
} & Omit<ComponentPropsWithoutRef<"label">, "children">;

const Label = forwardRef<HTMLLabelElement, LabelProps>((props, ref) => {
	const {
		label,
		className,
		error,
		helperText,
		direction,
		children,
		disabled,
		...restProps
	} = props;

	const text = typeof label === "object" ? label.text : label;
	const description = typeof label === "object" ? label.description : undefined;
	const required = typeof label === "object" ? label.required : false;

	return (
		<div className={cn("flex h-fit min-w-0 flex-col", className)}>
			<div className={cn(wrapperVariants({ direction }))}>
				{(!!text || !!description) && (
					<div className="flex min-w-0 flex-col gap-1">
						{text && (
							<LabelPrimitive.Root
								ref={ref}
								className={cn(labelVariants())}
								data-disabled={disabled || undefined}
								{...restProps}
							>
								{text}
								{required === true && (
									<span className="text-destructive ml-1">*</span>
								)}
								{required === "optional" && (
									<span className="text-muted-foreground ml-1 text-xs font-normal">
										(opcional)
									</span>
								)}
							</LabelPrimitive.Root>
						)}
						{description && (
							<p className="text-muted-foreground text-xs">{description}</p>
						)}
					</div>
				)}

				{children}
			</div>

			{(typeof error === "string" && error) || helperText ? (
				<p
					className={cn(
						"mt-1.5 text-xs",
						error ? "text-destructive" : "text-muted-foreground"
					)}
				>
					{typeof error === "string" && error ? error : helperText}
				</p>
			) : null}
		</div>
	);
});
Label.displayName = "Label";

export { Label };
export type { LabelProps };
