"use client";

import { ChevronDown } from "lucide-react";
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

import type { FC } from "react";

type UserMenuProps = {
	name?: string | null;
	email?: string | null;
};

/**
 * Menu do usuário no header: Conta e Sair.
 */
const UserMenu: FC<UserMenuProps> = (props) => {
	const { name, email } = props;
	const router = useRouter();
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
					<span className="max-w-[140px] truncate">{label}</span>
					<ChevronDown className="size-4 opacity-80" aria-hidden />
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end" className="w-52">
				{emailLabel}
				<DropdownMenuItem asChild>
					<Link href="/admin/account">Minha conta</Link>
				</DropdownMenuItem>
				<DropdownMenuSeparator />
				<DropdownMenuItem onSelect={() => void handleSignOut()}>
					Sair
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	);
};

export default UserMenu;
