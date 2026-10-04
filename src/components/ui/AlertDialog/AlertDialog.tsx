"use client";

import * as AlertDialogPrimitive from "@radix-ui/react-alert-dialog";

import { buttonVariants } from "@/components/ui/Button/variants";
import { cn } from "@/utils";

import type { FC } from "react";

const AlertDialog: FC<
	React.ComponentProps<typeof AlertDialogPrimitive.Root>
> = (props) => {
	const { ...restProps } = props;
	return <AlertDialogPrimitive.Root {...restProps} />;
};

const AlertDialogTrigger: FC<
	React.ComponentProps<typeof AlertDialogPrimitive.Trigger>
> = (props) => {
	const { ...restProps } = props;
	return <AlertDialogPrimitive.Trigger {...restProps} />;
};

const AlertDialogPortal: FC<
	React.ComponentProps<typeof AlertDialogPrimitive.Portal>
> = (props) => {
	const { ...restProps } = props;
	return <AlertDialogPrimitive.Portal {...restProps} />;
};

const AlertDialogOverlay: FC<
	React.ComponentProps<typeof AlertDialogPrimitive.Overlay>
> = (props) => {
	const { className, ...restProps } = props;
	return (
		<AlertDialogPrimitive.Overlay
			className={cn(
				"data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-[60] bg-black/40",
				className
			)}
			{...restProps}
		/>
	);
};

const AlertDialogContent: FC<
	React.ComponentProps<typeof AlertDialogPrimitive.Content>
> = (props) => {
	const { className, ...restProps } = props;
	return (
		<AlertDialogPortal>
			<AlertDialogOverlay />
			<AlertDialogPrimitive.Content
				className={cn(
					"bg-card text-card-foreground fixed top-1/2 left-1/2 z-[60] grid w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 gap-4 rounded-xl border p-4 shadow-lg",
					className
				)}
				{...restProps}
			/>
		</AlertDialogPortal>
	);
};

const AlertDialogHeader: FC<React.ComponentProps<"div">> = (props) => {
	const { className, ...restProps } = props;
	return <div className={cn("flex flex-col gap-1", className)} {...restProps} />;
};

const AlertDialogFooter: FC<React.ComponentProps<"div">> = (props) => {
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

const AlertDialogTitle: FC<
	React.ComponentProps<typeof AlertDialogPrimitive.Title>
> = (props) => {
	const { className, ...restProps } = props;
	return (
		<AlertDialogPrimitive.Title
			className={cn("text-base font-medium", className)}
			{...restProps}
		/>
	);
};

const AlertDialogDescription: FC<
	React.ComponentProps<typeof AlertDialogPrimitive.Description>
> = (props) => {
	const { className, ...restProps } = props;
	return (
		<AlertDialogPrimitive.Description
			className={cn("text-muted-foreground text-sm", className)}
			{...restProps}
		/>
	);
};

const AlertDialogAction: FC<
	React.ComponentProps<typeof AlertDialogPrimitive.Action>
> = (props) => {
	const { className, ...restProps } = props;
	return (
		<AlertDialogPrimitive.Action
			className={cn(buttonVariants({ variant: "default" }), className)}
			{...restProps}
		/>
	);
};

const AlertDialogCancel: FC<
	React.ComponentProps<typeof AlertDialogPrimitive.Cancel>
> = (props) => {
	const { className, ...restProps } = props;
	return (
		<AlertDialogPrimitive.Cancel
			className={cn(buttonVariants({ variant: "outline" }), className)}
			{...restProps}
		/>
	);
};

export {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogOverlay,
	AlertDialogPortal,
	AlertDialogTitle,
	AlertDialogTrigger
};
