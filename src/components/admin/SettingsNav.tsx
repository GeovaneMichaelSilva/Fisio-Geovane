"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { useClinicRole } from "@/hooks/useClinicRole";
import { cn } from "@/utils";

/**
 * Subnav das configurações (itens sensíveis só para owner).
 */
export function SettingsNav() {
	const pathname = usePathname();
	const { isOwner, isLoading } = useClinicRole();

	const items = [
		{ href: "/admin/settings", label: "Clínica", exact: true, ownerOnly: false },
		{
			href: "/admin/settings/service-types",
			label: "Tipos de atendimento",
			ownerOnly: false
		},
		{
			href: "/admin/settings/account",
			label: "Conta",
			ownerOnly: false
		},
		{
			href: "/admin/settings/team",
			label: "Equipe",
			ownerOnly: true
		},
		{
			href: "/admin/settings/integrations",
			label: "Integrações",
			ownerOnly: true
		}
	].filter((item) => !item.ownerOnly || isOwner || isLoading);

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
