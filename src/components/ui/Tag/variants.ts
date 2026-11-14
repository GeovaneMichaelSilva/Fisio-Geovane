import { cva } from "class-variance-authority";

import { cn } from "@/utils";

export const tagVariants = cva(
	cn(
		"inline-flex items-center justify-center rounded-md border px-2 py-0.5",
		"text-xs font-medium leading-none transition-colors"
	),
	{
		variants: {
			variant: {
				default: "",
				secondary: "border-transparent",
				outline: "bg-transparent"
			},
			color: {
				default: "",
				info: "",
				destructive: "",
				success: "",
				warning: ""
			}
		},
		defaultVariants: {
			variant: "default",
			color: "default"
		},
		compoundVariants: [
			{
				variant: "default",
				color: "default",
				className: "border-border bg-muted text-foreground"
			},
			{
				variant: "default",
				color: "info",
				className: "border-info/30 bg-info/10 text-info"
			},
			{
				variant: "default",
				color: "destructive",
				className: "border-destructive/30 bg-destructive/10 text-destructive"
			},
			{
				variant: "default",
				color: "success",
				className: "border-success/30 bg-success/10 text-success"
			},
			{
				variant: "default",
				color: "warning",
				className: "border-warning/30 bg-warning/10 text-warning"
			},

			{
				variant: "secondary",
				color: "default",
				className: "bg-muted text-muted-foreground"
			},
			{
				variant: "secondary",
				color: "info",
				className: "bg-info/15 text-info"
			},
			{
				variant: "secondary",
				color: "destructive",
				className: "bg-destructive/15 text-destructive"
			},
			{
				variant: "secondary",
				color: "success",
				className: "bg-success/15 text-success"
			},
			{
				variant: "secondary",
				color: "warning",
				className: "bg-warning/15 text-warning"
			},

			{
				variant: "outline",
				color: "default",
				className: "border-border text-foreground"
			},
			{
				variant: "outline",
				color: "info",
				className: "border-info/50 text-info"
			},
			{
				variant: "outline",
				color: "destructive",
				className: "border-destructive/50 text-destructive"
			},
			{
				variant: "outline",
				color: "success",
				className: "border-success/50 text-success"
			},
			{
				variant: "outline",
				color: "warning",
				className: "border-warning/50 text-warning"
			}
		]
	}
);
