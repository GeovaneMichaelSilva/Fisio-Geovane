import Image from "next/image";
import Link from "next/link";

import type { ReactNode } from "react";

type LegalLayoutProps = {
	title: string;
	updated: string;
	children: ReactNode;
};

/**
 * Layout simples para páginas jurídicas públicas (termos / privacidade).
 */
export function LegalLayout({ title, updated, children }: LegalLayoutProps) {
	return (
		<main className="bg-background text-foreground min-h-dvh">
			<header className="border-border bg-primary text-primary-foreground border-b-brand border-b-4">
				<div className="mx-auto flex max-w-3xl items-center gap-3 px-4 py-4 sm:px-6">
					<Link href="/" className="flex min-w-0 items-center gap-3">
						<Image
							src="/brand/logo-mark.png"
							alt=""
							width={40}
							height={40}
							className="size-10 shrink-0 rounded-md bg-white object-contain p-0.5"
						/>
						<span className="truncate text-sm font-medium tracking-wide">
							Geovane Michael da Silva
						</span>
					</Link>
				</div>
			</header>

			<section className="border-border border-b bg-[hsl(36_33%_96%)]">
				<div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-12">
					<h1 className="text-3xl font-medium tracking-tight text-[hsl(158_60%_16%)] sm:text-4xl">
						{title}
					</h1>
					<p className="text-muted-foreground mt-2 text-sm">
						Última atualização: {updated}
					</p>
				</div>
			</section>

			<article className="legal-prose mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-12">
				{children}
			</article>

			<footer className="border-border text-muted-foreground border-t py-8 text-center text-xs">
				<div className="mx-auto flex max-w-3xl flex-wrap items-center justify-center gap-x-4 gap-y-2 px-4">
					<Link href="/" className="hover:text-foreground underline-offset-4 hover:underline">
						Início
					</Link>
					<Link
						href="/politica-de-privacidade"
						className="hover:text-foreground underline-offset-4 hover:underline"
					>
						Privacidade
					</Link>
					<Link
						href="/termos-de-uso"
						className="hover:text-foreground underline-offset-4 hover:underline"
					>
						Termos de uso
					</Link>
				</div>
				<p className="mt-3">
					© 2026 Geovane Michael da Silva. Todos os direitos reservados.
				</p>
			</footer>

			<style>{`
				.legal-prose h2 {
					font-size: 1.25rem;
					font-weight: 600;
					margin-top: 2rem;
					margin-bottom: 0.75rem;
					color: hsl(158 60% 16%);
				}
				.legal-prose p,
				.legal-prose li {
					color: hsl(var(--muted-foreground));
					line-height: 1.7;
				}
				.legal-prose p {
					margin-bottom: 0.875rem;
				}
				.legal-prose ul {
					list-style: disc;
					padding-left: 1.25rem;
					margin-bottom: 1rem;
				}
				.legal-prose a {
					color: hsl(var(--primary));
					font-weight: 500;
					text-decoration: underline;
					text-underline-offset: 3px;
				}
				.legal-prose strong {
					color: hsl(var(--foreground));
					font-weight: 600;
				}
			`}</style>
		</main>
	);
}
