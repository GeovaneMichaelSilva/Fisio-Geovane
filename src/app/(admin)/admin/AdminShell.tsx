"use client";

import Image from "next/image";
import Link from "next/link";

import { AdminNav } from "./AdminNav";
import { SignOutButton } from "./SignOutButton";

const navItems = [
	{ href: "/admin", label: "Início" },
	{ href: "/admin/agenda", label: "Agenda" },
	{ href: "/admin/patients", label: "Pacientes" },
	{ href: "/admin/records", label: "Atendimentos" },
	{ href: "/admin/finance", label: "Financeiro" },
	{ href: "/admin/settings", label: "Configurações" }
];

type AdminShellProps = {
	email?: string | null;
	children: React.ReactNode;
};

/**
 * Shell do admin (client): nav + header permanecem montados entre rotas.
 */
export function AdminShell({ email, children }: AdminShellProps) {
	return (
		<div className="bg-background flex min-h-screen flex-col">
			<header className="border-border bg-primary text-primary-foreground border-b-brand border-b-4">
				<div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-4">
					<Link href="/admin" className="flex shrink-0 items-center gap-3">
						<Image
							src="/brand/logo.png"
							alt=""
							width={56}
							height={56}
							className="rounded-md bg-white"
						/>
						<div>
							<p className="text-xs tracking-[0.2em] uppercase opacity-80">
								Geovane Michael da Silva
							</p>
							<p className="text-lg font-medium">Gestão de atendimentos</p>
						</div>
					</Link>
					<div className="ml-auto flex items-center gap-2">
						<span className="text-primary-foreground/80 hidden text-sm sm:inline">
							{email}
						</span>
						<SignOutButton />
					</div>
				</div>
				<AdminNav items={navItems} />
			</header>
			<main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6">
				{children}
			</main>
		</div>
	);
}
