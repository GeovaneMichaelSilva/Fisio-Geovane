"use client";

import Image from "next/image";
import Link from "next/link";

import { AdminNav } from "./AdminNav";
import { SignOutButton } from "./SignOutButton";

const navItems = [
	{ href: "/admin", label: "Início", short: "Início" },
	{ href: "/admin/agenda", label: "Agenda", short: "Agenda" },
	{ href: "/admin/patients", label: "Pacientes", short: "Pacientes" },
	{ href: "/admin/records", label: "Atendimentos", short: "Atend." },
	{ href: "/admin/finance", label: "Financeiro", short: "Finan." },
	{ href: "/admin/settings", label: "Configurações", short: "Config" }
];

type AdminShellProps = {
	email?: string | null;
	children: React.ReactNode;
};

/**
 * Shell do admin (client): header + nav inferior no mobile / superior no desktop.
 */
export function AdminShell({ email, children }: AdminShellProps) {
	return (
		<div className="bg-background flex min-h-dvh flex-col">
			<header className="border-border bg-primary text-primary-foreground border-b-brand sticky top-0 z-40 border-b-4">
				<div className="mx-auto flex max-w-6xl items-center gap-3 px-3 py-3 sm:gap-4 sm:px-4 sm:py-4">
					<Link href="/admin" className="flex min-w-0 shrink items-center gap-2.5 sm:gap-3">
						<Image
							src="/brand/logo.png"
							alt="Geovane Michael da Silva"
							width={48}
							height={48}
							className="size-10 shrink-0 rounded-md bg-white sm:size-14"
						/>
						<div className="min-w-0">
							<p className="truncate text-[10px] tracking-[0.16em] uppercase opacity-80 sm:text-xs sm:tracking-[0.2em]">
								Geovane Michael da Silva
							</p>
							<p className="truncate text-base font-medium sm:text-lg">
								Gestão de atendimentos
							</p>
						</div>
					</Link>
					<div className="ml-auto flex shrink-0 items-center gap-2">
						<span className="text-primary-foreground/80 hidden max-w-[180px] truncate text-sm lg:inline">
							{email}
						</span>
						<SignOutButton />
					</div>
				</div>
				{/* Desktop / tablet: nav no topo */}
				<div className="hidden md:block">
					<AdminNav items={navItems} variant="top" />
				</div>
			</header>

			<main className="mx-auto w-full max-w-6xl flex-1 px-4 py-5 pb-24 sm:py-6 md:pb-6">
				{children}
			</main>

			{/* Mobile: nav inferior fixa */}
			<div className="border-border bg-primary text-primary-foreground fixed inset-x-0 bottom-0 z-40 border-t md:hidden">
				<AdminNav items={navItems} variant="bottom" />
			</div>
		</div>
	);
}
