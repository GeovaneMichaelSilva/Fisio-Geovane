"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/utils";

const items = [
	{ href: "/admin/settings", label: "Clínica", exact: true },
	{ href: "/admin/settings/service-types", label: "Tipos de atendimento" },
	{ href: "/admin/settings/integrations", label: "Integrações" }
];

/**
 * Subnav das configurações.
 */
export function SettingsNav() {
	const pathname = usePathname();

	return (
		<nav className="flex flex-wrap gap-2">
			{items.map((item) => {
				const active = item.exact
					? pathname === item.href
					: pathname.startsWith(item.href);

				return (
					<Link
						key={item.href}
						href={item.href}
						className={cn(
							"rounded-md px-3 py-1.5 text-sm transition-colors",
							active
								? "bg-primary text-primary-foreground font-medium"
								: "bg-secondary text-secondary-foreground hover:bg-secondary-hover"
						)}
					>
						{item.label}
					</Link>
				);
			})}
		</nav>
	);
}
