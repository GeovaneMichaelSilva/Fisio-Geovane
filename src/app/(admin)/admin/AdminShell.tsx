"use client";

import Image from "next/image";
import Link from "next/link";

import AdminNav from "./AdminNav";
import UserMenu from "./UserMenu";

import type { FC, ReactNode } from "react";
import type { ComponentPropsWithoutRef } from "react";

const navItems = [
	{ href: "/admin", label: "Início", short: "Início" },
	{ href: "/admin/agenda", label: "Agenda", short: "Agenda" },
	{ href: "/admin/patients", label: "Pacientes", short: "Pacientes" },
	{ href: "/admin/records", label: "Atendimentos", short: "Atend." },
	{ href: "/admin/finance", label: "Financeiro", short: "Finan." },
	{ href: "/admin/settings", label: "Configurações", short: "Config" }
];

type AdminShellProps = {
	name?: string | null;
	email?: string | null;
	children: ReactNode;
} & ComponentPropsWithoutRef<"div">;

/**
 * Shell do admin: uma barra (logo · nav · conta).
 */
const AdminShell: FC<AdminShellProps> = (props) => {
	const { name, email, children, ...restProps } = props;

	return (
		<div className="bg-background flex min-h-dvh flex-col" {...restProps}>
			<header className="border-border bg-primary text-primary-foreground border-b-brand sticky top-0 z-40 border-b-4">
				<div className="mx-auto flex max-w-6xl items-center gap-2 px-3 py-2 sm:gap-3 sm:px-4 sm:py-2.5">
					<Link
						href="/admin"
						className="shrink-0 rounded-md focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:outline-hidden"
						aria-label="Início"
					>
						<Image
							src="/brand/logo-mark-white.png"
							alt=""
							width={40}
							height={40}
							className="size-9 object-contain sm:size-10"
							priority
						/>
					</Link>

					<AdminNav items={navItems} />

					<div className="shrink-0">
						<UserMenu name={name} email={email} />
					</div>
				</div>
			</header>

			<main className="mx-auto w-full max-w-6xl flex-1 px-4 py-5 sm:py-6">
				{children}
			</main>
		</div>
	);
};

export default AdminShell;
