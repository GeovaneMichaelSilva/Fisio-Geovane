"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/utils";

import type { ComponentPropsWithoutRef, FC } from "react";

type NavItem = { href: string; label: string; short?: string };

type AdminNavProps = {
	items: NavItem[];
} & ComponentPropsWithoutRef<"nav">;

/**
 * Nav inline do header (logo · nav · conta).
 */
const AdminNav: FC<AdminNavProps> = (props) => {
	const { items, className, ...restProps } = props;
	const pathname = usePathname();

	return (
		<nav
			aria-label="Navegação principal"
			className={cn("min-w-0 flex-1 overflow-x-auto", className)}
			{...restProps}
		>
			<ul className="flex items-center gap-0.5 sm:gap-1">
				{items.map((item) => {
					const active =
						item.href === "/admin"
							? pathname === "/admin"
							: pathname.startsWith(item.href);

					return (
						<li key={item.href} className="shrink-0">
							<Link
								href={item.href}
								className={cn(
									"block rounded-md px-2 py-1.5 text-xs whitespace-nowrap transition-colors sm:px-3 sm:text-sm",
									active
										? "bg-background text-foreground font-medium"
										: "text-primary-foreground/85 hover:bg-background/15"
								)}
							>
								<span className="sm:hidden">{item.short ?? item.label}</span>
								<span className="hidden sm:inline">{item.label}</span>
							</Link>
						</li>
					);
				})}
			</ul>
		</nav>
	);
};

export default AdminNav;
