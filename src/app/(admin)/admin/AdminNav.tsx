"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/utils";

type NavItem = { href: string; label: string };

export function AdminNav({ items }: { items: NavItem[] }) {
	const pathname = usePathname();

	return (
		<nav className="bg-background/10 border-primary-hover border-t">
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
}
