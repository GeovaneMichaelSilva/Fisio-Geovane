"use client";

import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu";

import { cn } from "@/utils";

import type { ComponentPropsWithoutRef, FC } from "react";

const DropdownMenu: FC<
	ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Root>
> = (props) => {
	const { ...restProps } = props;
	return <DropdownMenuPrimitive.Root {...restProps} />;
};

const DropdownMenuTrigger: FC<
	ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Trigger>
> = (props) => {
	const { ...restProps } = props;
	return <DropdownMenuPrimitive.Trigger {...restProps} />;
};

const DropdownMenuGroup: FC<
	ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Group>
> = (props) => {
	const { ...restProps } = props;
	return <DropdownMenuPrimitive.Group {...restProps} />;
};

const DropdownMenuPortal: FC<
	ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Portal>
> = (props) => {
	const { ...restProps } = props;
	return <DropdownMenuPrimitive.Portal {...restProps} />;
};

const DropdownMenuContent: FC<
	ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Content>
> = (props) => {
	const { className, sideOffset = 6, ...restProps } = props;
	return (
		<DropdownMenuPrimitive.Portal>
			<DropdownMenuPrimitive.Content
				sideOffset={sideOffset}
				className={cn(
					"bg-card text-card-foreground border-border z-50 min-w-44 overflow-hidden rounded-md border p-1 shadow-md",
					"data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
					"data-[side=bottom]:slide-in-from-top-2 data-[side=top]:slide-in-from-bottom-2",
					className
				)}
				{...restProps}
			/>
		</DropdownMenuPrimitive.Portal>
	);
};

const DropdownMenuLabel: FC<
	ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Label>
> = (props) => {
	const { className, ...restProps } = props;
	return (
		<DropdownMenuPrimitive.Label
			className={cn(
				"text-muted-foreground px-2 py-1.5 text-xs font-medium",
				className
			)}
			{...restProps}
		/>
	);
};

const DropdownMenuItem: FC<
	ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Item>
> = (props) => {
	const { className, ...restProps } = props;
	return (
		<DropdownMenuPrimitive.Item
			className={cn(
				"relative flex cursor-pointer items-center rounded-sm px-2 py-1.5 text-sm outline-hidden select-none",
				"focus:bg-secondary focus:text-secondary-foreground",
				"data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
				className
			)}
			{...restProps}
		/>
	);
};

const DropdownMenuSeparator: FC<
	ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Separator>
> = (props) => {
	const { className, ...restProps } = props;
	return (
		<DropdownMenuPrimitive.Separator
			className={cn("bg-border -mx-1 my-1 h-px", className)}
			{...restProps}
		/>
	);
};

export {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuPortal,
	DropdownMenuSeparator,
	DropdownMenuTrigger
};
