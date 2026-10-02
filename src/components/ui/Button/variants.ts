import { cva } from "class-variance-authority";

import { cn } from "@/utils";

export const buttonVariants = cva(
	cn(
		"relative inline-flex items-center justify-center gap-2 whitespace-nowrap",
		"rounded-md text-sm font-medium transition-colors ring-ring/70",
		"[&_svg]:pointer-events-none [&_svg]:shrink-0",
		"focus-visible:outline-hidden focus-visible:ring-[3px]",
		"disabled:pointer-events-none disabled:opacity-50",
		"data-[visually-disabled=true]:opacity-50 data-[visually-disabled=true]:cursor-default"
	),
	{
		variants: {
			variant: {
				default: "",
				outline: "border",
				secondary: "",
				ghost: "bg-transparent",
				link: cn(
					"bg-transparent underline-offset-4",
					"data-[visually-disabled=false]:hover:underline"
				)
			},
			color: {
				default: "",
				destructive: "",
				success: ""
			},
			size: {
				xs: "h-8 px-2 [&_svg]:size-4",
				sm: "h-9 px-3 [&_svg]:size-4",
				default: "h-10 px-4 py-2 [&_svg]:size-4",
				lg: "h-11 px-4 [&_svg]:size-4",
				"icon-xs": "h-8 w-8 [&_svg]:size-4",
				"icon-sm": "h-9 w-9 [&_svg]:size-5",
				"icon-default": "h-10 w-10 [&_svg]:size-5"
			}
		},
		defaultVariants: {
			variant: "default",
			color: "default",
			size: "default"
		},
		compoundVariants: [
			{
				variant: "default",
				color: "default",
				className: [
					"bg-primary text-primary-foreground",
					"data-[visually-disabled=false]:hover:bg-primary-hover"
				]
			},
			{
				variant: "default",
				color: "destructive",
				className: [
					"bg-destructive text-destructive-foreground",
					"data-[visually-disabled=false]:hover:bg-destructive-300"
				]
			},
			{
				variant: "default",
				color: "success",
				className: [
					"bg-success text-success-foreground",
					"data-[visually-disabled=false]:hover:opacity-90"
				]
			},
			{
				variant: "outline",
				color: "default",
				className: [
					"border-input text-foreground bg-background",
					"data-[visually-disabled=false]:hover:bg-accent data-[visually-disabled=false]:hover:text-accent-foreground"
				]
			},
			{
				variant: "outline",
				color: "destructive",
				className: [
					"border-destructive text-destructive",
					"data-[visually-disabled=false]:hover:bg-destructive/10"
				]
			},
			{
				variant: "secondary",
				color: "default",
				className: [
					"bg-secondary text-secondary-foreground",
					"data-[visually-disabled=false]:hover:bg-secondary-hover"
				]
			},
			{
				variant: "ghost",
				color: "default",
				className: [
					"text-foreground",
					"data-[visually-disabled=false]:hover:bg-accent data-[visually-disabled=false]:hover:text-accent-foreground"
				]
			},
			{
				variant: "ghost",
				color: "destructive",
				className: [
					"text-destructive",
					"data-[visually-disabled=false]:hover:bg-destructive/10"
				]
			},
			{
				variant: "link",
				color: "default",
				className: "text-primary"
			},
			{
				variant: "link",
				color: "destructive",
				className: "text-destructive"
			}
		]
	}
);
