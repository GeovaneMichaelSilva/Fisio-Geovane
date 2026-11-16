"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/utils";

import type { ComponentPropsWithoutRef, FC } from "react";

type NavItem = { href: string; label: string; short?: string };

type AdminNavProps = {
	items: NavItem[];
} & ComponentPropsWithoutRef<"nav">;

const isActivePath = (pathname: string, href: string) =>
	href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);

/**
 * Nav em linha do header — só desktop (md+).
 */
const AdminNav: FC<AdminNavProps> = (props) => {
	const { items, className, ...restProps } = props;
	const pathname = usePathname();

	return (
		<nav
			aria-label="Navegação principal"
			className={cn("hidden min-w-0 flex-1 md:block", className)}
			{...restProps}
		>
			<ul className="flex flex-wrap items-center gap-1">
				{items.map((item) => {
					const active = isActivePath(pathname, item.href);
					return (
						<li key={item.href}>
							<Link
								href={item.href}
								className={cn(
									"block rounded-md px-3 py-1.5 text-sm whitespace-nowrap transition-colors",
									active
										? "bg-background text-foreground font-medium"
										: "text-primary-foreground/85 hover:bg-background/15"
								)}
							>
								{item.label}
							</Link>
						</li>
					);
				})}
			</ul>
		</nav>
	);
};

export default AdminNav;
