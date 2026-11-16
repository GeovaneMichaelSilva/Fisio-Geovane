"use client";

import { Menu } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/Button";
import {
	Sheet,
	SheetBody,
	SheetContent,
	SheetHeader,
	SheetTitle,
	SheetTrigger
} from "@/components/ui/Sheet";
import { cn } from "@/utils";

import type { FC } from "react";

type NavItem = { href: string; label: string };

type AdminMobileMenuProps = {
	items: NavItem[];
};

const isActivePath = (pathname: string, href: string) =>
	href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);

/**
 * Drawer lateral de navegação — só mobile (abre da esquerda).
 */
const AdminMobileMenu: FC<AdminMobileMenuProps> = (props) => {
	const { items } = props;
	const pathname = usePathname();
	const [open, setOpen] = useState(false);

	return (
		<Sheet open={open} onOpenChange={setOpen}>
			<SheetTrigger asChild>
				<Button
					type="button"
					variant="secondary"
					size="icon-sm"
					className="bg-background/15 text-primary-foreground hover:bg-background/25 shrink-0 border-0 md:hidden"
					aria-label="Abrir menu de navegação"
				>
					<Menu className="size-5" aria-hidden />
				</Button>
			</SheetTrigger>
			<SheetContent side="left" className="p-0">
				<SheetHeader>
					<SheetTitle>Menu</SheetTitle>
				</SheetHeader>
				<SheetBody>
					<nav aria-label="Navegação principal">
						<ul className="flex flex-col gap-1">
							{items.map((item) => {
								const active = isActivePath(pathname, item.href);
								return (
									<li key={item.href}>
										<Link
											href={item.href}
											onClick={() => setOpen(false)}
											className={cn(
												"flex min-h-11 items-center rounded-md px-3 text-sm transition-colors",
												active
													? "bg-primary text-primary-foreground font-medium"
													: "hover:bg-secondary"
											)}
										>
											{item.label}
										</Link>
									</li>
								);
							})}
						</ul>
					</nav>
				</SheetBody>
			</SheetContent>
		</Sheet>
	);
};

export default AdminMobileMenu;
