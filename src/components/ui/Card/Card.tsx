import { forwardRef } from "react";

import { cn } from "@/utils";

import type { ElementType, HTMLAttributes } from "react";

type CardProps = HTMLAttributes<HTMLDivElement> & {
	as?: ElementType;
};

const Card = forwardRef<HTMLDivElement, CardProps>(
	({ className, as: Component = "div", ...restProps }, ref) => (
		<Component
			ref={ref}
			className={cn(
				"border-border bg-card text-card-foreground flex flex-col space-y-6 rounded-xl border py-4 shadow-xs",
				className
			)}
			{...restProps}
		/>
	)
);
Card.displayName = "Card";

type CardHeaderProps = HTMLAttributes<HTMLElement>;

const CardHeader = forwardRef<HTMLElement, CardHeaderProps>(
	({ className, ...restProps }, ref) => (
		<header ref={ref} className={cn("px-4", className)} {...restProps} />
	)
);
CardHeader.displayName = "CardHeader";

type CardTitleProps = HTMLAttributes<HTMLElement> & {
	as?: ElementType;
};

const CardTitle = forwardRef<HTMLElement, CardTitleProps>(
	({ className, as: Component = "div", ...restProps }, ref) => (
		<Component
			ref={ref}
			className={cn(
				"text-foreground max-w-full min-w-0 text-base font-medium",
				className
			)}
			{...restProps}
		/>
	)
);
CardTitle.displayName = "CardTitle";

type CardDescriptionProps = HTMLAttributes<HTMLDivElement>;

const CardDescription = forwardRef<HTMLDivElement, CardDescriptionProps>(
	({ className, ...restProps }, ref) => (
		<div
			ref={ref}
			className={cn("text-muted-foreground text-sm", className)}
			{...restProps}
		/>
	)
);
CardDescription.displayName = "CardDescription";

type CardContentProps = HTMLAttributes<HTMLDivElement>;

const CardContent = forwardRef<HTMLDivElement, CardContentProps>(
	({ className, ...restProps }, ref) => (
		<main ref={ref} className={cn("flex-1 px-4", className)} {...restProps} />
	)
);
CardContent.displayName = "CardContent";

type CardFooterProps = HTMLAttributes<HTMLElement>;

const CardFooter = forwardRef<HTMLElement, CardFooterProps>(
	({ className, ...restProps }, ref) => (
		<footer
			ref={ref}
			className={cn("flex items-center px-4", className)}
			{...restProps}
		/>
	)
);
CardFooter.displayName = "CardFooter";

export {
	Card,
	CardHeader,
	CardTitle,
	CardDescription,
	CardContent,
	CardFooter
};
