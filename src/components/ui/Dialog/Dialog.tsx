"use client";

import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";

import { cn } from "@/utils";

import type { FC } from "react";

const Dialog: FC<React.ComponentProps<typeof DialogPrimitive.Root>> = (props) => {
	const { ...restProps } = props;
	return <DialogPrimitive.Root {...restProps} />;
};

const DialogTrigger: FC<
	React.ComponentProps<typeof DialogPrimitive.Trigger>
> = (props) => {
	const { ...restProps } = props;
	return <DialogPrimitive.Trigger {...restProps} />;
};

const DialogPortal: FC<
	React.ComponentProps<typeof DialogPrimitive.Portal>
> = (props) => {
	const { ...restProps } = props;
	return <DialogPrimitive.Portal {...restProps} />;
};

const DialogClose: FC<React.ComponentProps<typeof DialogPrimitive.Close>> = (
	props
) => {
	const { ...restProps } = props;
	return <DialogPrimitive.Close {...restProps} />;
};

const DialogOverlay: FC<
	React.ComponentProps<typeof DialogPrimitive.Overlay>
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

type DialogContentProps = React.ComponentProps<typeof DialogPrimitive.Content> & {
	showClose?: boolean;
};

const DialogContent: FC<DialogContentProps> = (props) => {
	const { className, children, showClose = true, ...restProps } = props;
	return (
		<DialogPortal>
			<DialogOverlay />
			<DialogPrimitive.Content
				className={cn(
					"bg-card text-card-foreground fixed top-1/2 left-1/2 z-50 grid w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 gap-4 rounded-xl border p-4 shadow-lg",
					"data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
					className
				)}
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
		</DialogPortal>
	);
};

const DialogHeader: FC<React.ComponentProps<"div">> = (props) => {
	const { className, ...restProps } = props;
	return (
		<div className={cn("flex flex-col gap-1 pr-8", className)} {...restProps} />
	);
};

const DialogFooter: FC<React.ComponentProps<"div">> = (props) => {
	const { className, ...restProps } = props;
	return (
		<div
			className={cn(
				"flex flex-col-reverse gap-2 sm:flex-row sm:justify-end sm:gap-2",
				className
			)}
			{...restProps}
		/>
	);
};

const DialogTitle: FC<
	React.ComponentProps<typeof DialogPrimitive.Title>
> = (props) => {
	const { className, ...restProps } = props;
	return (
		<DialogPrimitive.Title
			className={cn("text-base font-medium", className)}
			{...restProps}
		/>
	);
};

const DialogDescription: FC<
	React.ComponentProps<typeof DialogPrimitive.Description>
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
	Dialog,
	DialogClose,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogOverlay,
	DialogPortal,
	DialogTitle,
	DialogTrigger
};
