"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { useClinicRole } from "@/hooks/useClinicRole";
import { cn } from "@/utils";

import type { ComponentPropsWithoutRef, FC } from "react";

type SettingsNavProps = ComponentPropsWithoutRef<"nav">;

/**
 * Subnav das configurações da clínica (itens sensíveis só para owner).
 * Conta do usuário fica em /admin/account (fora daqui).
 */
const SettingsNav: FC<SettingsNavProps> = (props) => {
	const { ...restProps } = props;
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
		<nav className="flex flex-wrap gap-2" {...restProps}>
			{items.map((item) => {
				const active = item.exact
					? pathname === item.href
					: pathname.startsWith(item.href);

				const activeClass = active
					? "bg-primary text-primary-foreground font-medium"
					: "bg-secondary text-secondary-foreground hover:bg-secondary-hover";

				return (
					<Link
						key={item.href}
						href={item.href}
						className={cn(
							"rounded-md px-3 py-1.5 text-sm transition-colors",
							activeClass
						)}
					>
						{item.label}
					</Link>
				);
			})}
		</nav>
	);
};

export default SettingsNav;
