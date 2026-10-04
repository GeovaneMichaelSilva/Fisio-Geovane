"use client";

import { forwardRef, useId } from "react";

import { Label, resolveLabelAttributes } from "@/components/ui/Label";
import { cn } from "@/utils";

import type { ComponentPropsWithoutRef } from "react";
import type { LabelAttributes } from "@/components/ui/Label";

type SelectOption = {
	value: string;
	label: string;
	disabled?: boolean;
};

type SelectProps = Omit<ComponentPropsWithoutRef<"select">, "id"> & {
	id?: string;
	label?: LabelAttributes;
	error?: string | boolean;
	helperText?: string;
	options: ReadonlyArray<SelectOption>;
	placeholder?: string;
};

/**
 * Select nativo estilizado (melhor UX no mobile que combobox custom).
 */
const Select = forwardRef<HTMLSelectElement, SelectProps>((props, ref) => {
	const {
		id: idProp,
		label,
		error,
		helperText,
		className,
		disabled,
		options,
		placeholder,
		required,
		...rest
	} = props;
	const fallbackId = useId();
	const id = idProp || `select-${fallbackId}`;

	return (
		<Label
			htmlFor={id}
			label={resolveLabelAttributes(label, required)}
			error={error}
			helperText={helperText}
			disabled={disabled}
			className={className}
		>
			<select
				ref={ref}
				id={id}
				disabled={disabled}
				required={required}
				aria-required={required || undefined}
				aria-invalid={!!error || undefined}
				className={cn(
					"border-input bg-background text-foreground",
					"flex h-11 w-full rounded-md border px-3 py-2 text-sm shadow-xs sm:h-10",
					"focus-visible:ring-ring/70 focus-visible:ring-[3px] focus-visible:outline-hidden",
					"disabled:cursor-not-allowed disabled:opacity-50",
					"aria-invalid:border-destructive aria-invalid:ring-destructive/20"
				)}
				{...rest}
			>
				{placeholder ? (
					<option value="" disabled={required}>
						{placeholder}
					</option>
				) : null}
				{options.map((opt) => (
					<option
						key={opt.value}
						value={opt.value}
						disabled={opt.disabled}
					>
						{opt.label}
					</option>
				))}
			</select>
		</Label>
	);
});
Select.displayName = "Select";

export { Select };
export type { SelectProps, SelectOption };
