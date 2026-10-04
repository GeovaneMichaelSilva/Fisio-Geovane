"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/utils";

import type { ComponentPropsWithoutRef, FC } from "react";

type NavItem = { href: string; label: string; short?: string };

type AdminNavProps = {
	items: NavItem[];
	variant?: "top" | "bottom";
} & ComponentPropsWithoutRef<"nav">;

const AdminNav: FC<AdminNavProps> = (props) => {
	const { items, variant = "top", ...restProps } = props;
	const pathname = usePathname();

	if (variant === "bottom") {
		return (
			<nav
				aria-label="Navegação principal"
				className="mx-auto grid max-w-6xl grid-cols-6 gap-0.5 px-1 pt-1.5 pb-[max(0.375rem,env(safe-area-inset-bottom))]"
				{...restProps}
			>
				{items.map((item) => {
					const active =
						item.href === "/admin"
							? pathname === "/admin"
							: pathname.startsWith(item.href);

					return (
						<Link
							key={item.href}
							href={item.href}
							className={cn(
								"flex min-h-12 flex-col items-center justify-center rounded-md px-0.5 text-center text-[10px] leading-tight transition-colors",
								active
									? "bg-background text-foreground font-medium"
									: "text-primary-foreground/85 active:bg-background/15"
							)}
						>
							{item.short ?? item.label}
						</Link>
					);
				})}
			</nav>
		);
	}

	return (
		<nav
			aria-label="Navegação principal"
			className="bg-background/10 border-primary-hover border-t"
			{...restProps}
		>
			<div className="mx-auto flex max-w-6xl gap-1 overflow-x-auto px-4 py-2">
				{items.map((item) => {
					const active =
						item.href === "/admin"
							? pathname === "/admin"
							: pathname.startsWith(item.href);

					return (
						<Link
							key={item.href}
							href={item.href}
							className={cn(
								"rounded-md px-3 py-1.5 text-sm whitespace-nowrap transition-colors",
								active
									? "bg-background text-foreground font-medium"
									: "text-primary-foreground/85 hover:bg-background/15"
							)}
						>
							{item.label}
						</Link>
					);
				})}
			</div>
		</nav>
	);
};

export default AdminNav;
