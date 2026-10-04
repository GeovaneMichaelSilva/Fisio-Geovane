import { forwardRef, useId } from "react";

import { cn } from "@/utils";

import { Label, resolveLabelAttributes } from "../Label";

import type { ComponentPropsWithoutRef } from "react";
import type { LabelAttributes } from "../Label";

type InputProps = Omit<ComponentPropsWithoutRef<"input">, "id"> & {
	id?: string;
	label?: LabelAttributes;
	error?: string | boolean;
	helperText?: string;
	inputClassName?: string;
};

const Input = forwardRef<HTMLInputElement, InputProps>((props, ref) => {
	const {
		id: idProp,
		label,
		error,
		helperText,
		className,
		inputClassName,
		disabled,
		required,
		...restProps
	} = props;
	const fallbackId = useId();
	const id = idProp || `input-${fallbackId}`;

	return (
		<Label
			htmlFor={id}
			label={resolveLabelAttributes(label, required)}
			error={error}
			helperText={helperText}
			disabled={disabled}
			className={className}
		>
			<input
				ref={ref}
				id={id}
				disabled={disabled}
				required={required}
				aria-required={required || undefined}
				aria-invalid={!!error || undefined}
				className={cn(
					"border-input bg-background file:text-foreground placeholder:text-muted-foreground",
					"flex h-10 w-full rounded-md border px-3 py-2 text-sm shadow-xs",
					"focus-visible:ring-ring/70 focus-visible:ring-[3px] focus-visible:outline-hidden",
					"disabled:cursor-not-allowed disabled:opacity-50",
					"aria-invalid:border-destructive aria-invalid:ring-destructive/20",
					inputClassName
				)}
				{...restProps}
			/>
		</Label>
	);
});
Input.displayName = "Input";

export { Input };
export type { InputProps };
