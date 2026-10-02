"use client";

import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";

import { Button } from "@/components/ui/Button";

export function SignOutButton() {
	const router = useRouter();

	async function handleSignOut() {
		await signOut({ redirect: false });
		router.replace("/login");
		router.refresh();
	}

	return (
		<Button
			type="button"
			variant="secondary"
			size="sm"
			onClick={handleSignOut}
			className="bg-background/15 text-primary-foreground hover:bg-background/25 border-0"
		>
			Sair
		</Button>
	);
}
