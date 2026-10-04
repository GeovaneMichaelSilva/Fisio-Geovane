import { forwardRef, useId } from "react";

import { cn } from "@/utils";

import { Label, resolveLabelAttributes } from "../Label";

import type { ComponentPropsWithoutRef } from "react";
import type { LabelAttributes } from "../Label";

type TextareaProps = Omit<ComponentPropsWithoutRef<"textarea">, "id"> & {
	id?: string;
	label?: LabelAttributes;
	error?: string | boolean;
	helperText?: string;
	textareaClassName?: string;
};

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
	(props, ref) => {
		const {
			id: idProp,
			label,
			error,
			helperText,
			className,
			textareaClassName,
			disabled,
			required,
			...restProps
		} = props;
		const fallbackId = useId();
		const id = idProp || `textarea-${fallbackId}`;

		return (
			<Label
				htmlFor={id}
				label={resolveLabelAttributes(label, required)}
				error={error}
				helperText={helperText}
				disabled={disabled}
				className={className}
			>
				<textarea
					ref={ref}
					id={id}
					disabled={disabled}
					required={required}
					aria-required={required || undefined}
					aria-invalid={!!error || undefined}
					className={cn(
						"border-input bg-background placeholder:text-muted-foreground",
						"flex min-h-24 w-full rounded-md border px-3 py-2 text-sm shadow-xs",
						"focus-visible:ring-ring/70 focus-visible:ring-[3px] focus-visible:outline-hidden",
						"disabled:cursor-not-allowed disabled:opacity-50",
						"aria-invalid:border-destructive aria-invalid:ring-destructive/20",
						textareaClassName
					)}
					{...restProps}
				/>
			</Label>
		);
	}
);
Textarea.displayName = "Textarea";

export { Textarea };
export type { TextareaProps };
