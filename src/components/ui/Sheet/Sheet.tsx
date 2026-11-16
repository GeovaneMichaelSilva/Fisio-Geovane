"use client";

import * as DialogPrimitive from "@radix-ui/react-dialog";
import { cva, type VariantProps } from "class-variance-authority";
import { X } from "lucide-react";

import { cn } from "@/utils";

import type { ComponentPropsWithoutRef, FC, HTMLAttributes } from "react";

const Sheet: FC<ComponentPropsWithoutRef<typeof DialogPrimitive.Root>> = (
	props
) => {
	return <DialogPrimitive.Root {...props} />;
};

const SheetTrigger: FC<
	ComponentPropsWithoutRef<typeof DialogPrimitive.Trigger>
> = (props) => {
	return <DialogPrimitive.Trigger {...props} />;
};

const SheetClose: FC<
	ComponentPropsWithoutRef<typeof DialogPrimitive.Close>
> = (props) => {
	return <DialogPrimitive.Close {...props} />;
};

const SheetPortal: FC<
	ComponentPropsWithoutRef<typeof DialogPrimitive.Portal>
> = (props) => {
	return <DialogPrimitive.Portal {...props} />;
};

const SheetOverlay: FC<
	ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
> = (props) => {
	const { className, ...restProps } = props;
	return (
		<DialogPrimitive.Overlay
			className={cn(
				"data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-50 bg-black/40",
				className
			)}
			{...restProps}
		/>
	);
};

const sheetVariants = cva(
	cn(
		"bg-card text-card-foreground fixed z-50 flex flex-col shadow-lg transition ease-in-out",
		"data-[state=open]:animate-in data-[state=closed]:animate-out",
		"data-[state=open]:duration-300 data-[state=closed]:duration-200"
	),
	{
		variants: {
			side: {
				top: "border-border inset-x-0 top-0 border-b data-[state=closed]:slide-out-to-top data-[state=open]:slide-in-from-top",
				bottom:
					"border-border inset-x-0 bottom-0 border-t data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom",
				left: "border-border inset-y-0 left-0 h-full w-[min(100%,20rem)] border-r data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left",
				right:
					"border-border inset-y-0 right-0 h-full w-[min(100%,20rem)] border-l data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right"
			}
		},
		defaultVariants: {
			side: "left"
		}
	}
);

type SheetContentProps = ComponentPropsWithoutRef<
	typeof DialogPrimitive.Content
> &
	VariantProps<typeof sheetVariants> & {
		showClose?: boolean;
	};

const SheetContent: FC<SheetContentProps> = (props) => {
	const { side = "left", className, children, showClose = true, ...restProps } =
		props;
	return (
		<SheetPortal>
			<SheetOverlay />
			<DialogPrimitive.Content
				className={cn(sheetVariants({ side }), className)}
				{...restProps}
			>
				{children}
				{showClose ? (
					<DialogPrimitive.Close
						className="ring-offset-background focus:ring-ring absolute top-3 right-3 rounded-md p-1 opacity-70 transition-opacity hover:opacity-100 focus:ring-2 focus:outline-hidden"
						aria-label="Fechar"
					>
						<X className="size-4" />
					</DialogPrimitive.Close>
				) : null}
			</DialogPrimitive.Content>
		</SheetPortal>
	);
};

const SheetHeader: FC<HTMLAttributes<HTMLDivElement>> = (props) => {
	const { className, ...restProps } = props;
	return (
		<div
			className={cn(
				"border-border flex flex-col gap-1 border-b px-4 py-3 pr-10",
				className
			)}
			{...restProps}
		/>
	);
};

const SheetBody: FC<HTMLAttributes<HTMLDivElement>> = (props) => {
	const { className, ...restProps } = props;
	return (
		<div
			className={cn("flex-1 overflow-y-auto px-4 py-2", className)}
			{...restProps}
		/>
	);
};

const SheetTitle: FC<
	ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
> = (props) => {
	const { className, ...restProps } = props;
	return (
		<DialogPrimitive.Title
			className={cn("text-base font-medium", className)}
			{...restProps}
		/>
	);
};

const SheetDescription: FC<
	ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
> = (props) => {
	const { className, ...restProps } = props;
	return (
		<DialogPrimitive.Description
			className={cn("text-muted-foreground text-sm", className)}
			{...restProps}
		/>
	);
};

export {
	Sheet,
	SheetBody,
	SheetClose,
	SheetContent,
	SheetDescription,
	SheetHeader,
	SheetOverlay,
	SheetPortal,
	SheetTitle,
	SheetTrigger
};
