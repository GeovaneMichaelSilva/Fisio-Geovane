"use client";

import { evaluatePasswordRules } from "@/lib/auth/password";
import { cn } from "@/utils";

import type { ComponentPropsWithoutRef, FC } from "react";

type PasswordRequirementsProps = ComponentPropsWithoutRef<"ul"> & {
	password: string;
	/** Se false, some quando a senha estiver vazia. @default true após 1º caractere */
	alwaysShow?: boolean;
};

/**
 * Checklist ao vivo dos requisitos de senha (padrão hub-adseleto).
 */
const PasswordRequirements: FC<PasswordRequirementsProps> = (props) => {
	const { password, alwaysShow = false, className, ...restProps } = props;

	if (!alwaysShow && password.length === 0) {
		return null;
	}

	const rules = evaluatePasswordRules(password);

	return (
		<ul
			className={cn("space-y-1 text-xs", className)}
			aria-live="polite"
			{...restProps}
		>
			{rules.map((rule) => {
				const itemClass = rule.valid
					? "text-success"
					: "text-muted-foreground";
				const markClass = rule.valid
					? "bg-success/15 text-success"
					: "bg-muted text-muted-foreground";
				const mark = rule.valid ? "✓" : "·";

				return (
					<li
						key={rule.id}
						className={cn("flex items-center gap-1.5", itemClass)}
					>
						<span
							className={cn(
								"inline-flex size-4 shrink-0 items-center justify-center rounded-full text-[10px]",
								markClass
							)}
							aria-hidden
						>
							{mark}
						</span>
						<span>{rule.label}</span>
					</li>
				);
			})}
		</ul>
	);
};

export default PasswordRequirements;
