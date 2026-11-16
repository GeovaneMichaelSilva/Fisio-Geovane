"use client";

import { ChevronDown, Download } from "lucide-react";
import { signOut } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/Button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger
} from "@/components/ui/DropdownMenu";
import { usePwaInstall } from "@/hooks/usePwaInstall";

import type { FC } from "react";

type UserMenuProps = {
	name?: string | null;
	email?: string | null;
};

/**
 * Menu do usuário no header: Conta, instalar PWA e Sair.
 */
const UserMenu: FC<UserMenuProps> = (props) => {
	const { name, email } = props;
	const router = useRouter();
	const { canInstall, install } = usePwaInstall();
	const firstName = name?.trim().split(/\s+/)[0] || null;
	const label = firstName || "Conta";

	const handleSignOut = async () => {
		await signOut({ redirect: false });
		router.replace("/login");
		router.refresh();
	};

	let emailLabel = null;
	if (email) {
		emailLabel = (
			<DropdownMenuLabel className="truncate font-normal">
				{email}
			</DropdownMenuLabel>
		);
	}

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button
					type="button"
					variant="secondary"
					size="sm"
					className="bg-background/15 text-primary-foreground hover:bg-background/25 border-0"
				>
					<span className="max-w-[88px] truncate sm:max-w-[140px]">
						{label}
					</span>
					<ChevronDown className="size-4 opacity-80" aria-hidden />
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end" className="w-52">
				{emailLabel}
				<DropdownMenuItem asChild>
					<Link href="/admin/account">Minha conta</Link>
				</DropdownMenuItem>
				{canInstall ? (
					<DropdownMenuItem
						className="gap-2"
						onSelect={(event) => {
							event.preventDefault();
							void install();
						}}
					>
						<Download className="size-4 shrink-0" aria-hidden />
						Instalar app
					</DropdownMenuItem>
				) : null}
				<DropdownMenuSeparator />
				<DropdownMenuItem onSelect={() => void handleSignOut()}>
					Sair
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	);
};

export default UserMenu;
