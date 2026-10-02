import { cva } from "class-variance-authority";

export const labelVariants = cva(
	"text-foreground text-sm leading-none font-medium peer-disabled:cursor-not-allowed peer-disabled:opacity-70 data-[disabled=true]:opacity-70"
);

export const wrapperVariants = cva("flex gap-2", {
	variants: {
		direction: {
			column: "flex-col",
			row: "flex-row items-center",
			"row-reverse": "flex-row-reverse items-center"
		}
	},
	defaultVariants: {
		direction: "column"
	}
});
