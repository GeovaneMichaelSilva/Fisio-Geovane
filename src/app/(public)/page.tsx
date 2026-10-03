import Image from "next/image";
import Link from "next/link";

export const metadata = {
	title: "Geovane Michael da Silva — Fisioterapeuta",
	description:
		"Fisioterapia com acompanhamento clínico organizado. Atendimento e gestão de sessões.",
	robots: { index: true, follow: true }
};

/**
 * Landing pública — marca em primeiro plano; acesso interno discreto.
 */
export default function HomePage() {
	return (
		<main className="bg-background text-foreground relative min-h-dvh overflow-hidden">
			<div
				aria-hidden
				className="pointer-events-none absolute inset-0"
				style={{
					background:
						"radial-gradient(120% 80% at 50% -10%, hsl(40 35% 48% / 0.18), transparent 55%), linear-gradient(165deg, hsl(158 60% 16%) 0%, hsl(158 52% 22%) 42%, hsl(36 33% 92%) 42.1%, hsl(0 0% 97%) 100%)"
				}}
			/>
			<div
				aria-hidden
				className="pointer-events-none absolute inset-x-0 top-[38%] h-px bg-[hsl(40_35%_48%/0.35)]"
			/>

			<div className="relative mx-auto flex min-h-dvh w-full max-w-3xl flex-col px-6 py-10 sm:px-8 sm:py-14">
				<header className="flex items-center justify-end">
					<Link
						href="/login"
						className="text-primary-foreground/90 hover:text-primary-foreground text-sm underline-offset-4 transition-colors hover:underline"
					>
						Área interna
					</Link>
				</header>

				<section className="flex flex-1 flex-col items-center justify-center gap-8 pb-16 pt-6 text-center sm:gap-10">
					<div className="animate-in fade-in zoom-in-95 duration-700">
						<Image
							src="/brand/logo.png"
							alt="Geovane Michael da Silva — Fisioterapeuta"
							width={200}
							height={200}
							priority
							className="mx-auto rounded-xl bg-white shadow-md ring-1 ring-black/5"
						/>
					</div>

					<div className="animate-in fade-in slide-in-from-bottom-2 space-y-3 duration-700 delay-150 fill-mode-both">
						<p className="text-brand text-xs font-medium tracking-[0.28em] uppercase sm:text-sm">
							Fisioterapeuta
						</p>
						<h1 className="font-sans text-3xl font-medium tracking-tight text-[hsl(158_60%_16%)] sm:text-5xl">
							Geovane Michael da Silva
						</h1>
						<p className="text-muted-foreground mx-auto max-w-md text-base sm:text-lg">
							Crefito 549225-F · atendimento clínico com registro organizado de
							evolução e acompanhamento.
						</p>
					</div>

					<div className="animate-in fade-in slide-in-from-bottom-3 duration-700 delay-300 fill-mode-both">
						<Link
							href="/login"
							className="bg-primary text-primary-foreground hover:bg-primary-hover inline-flex min-h-12 items-center justify-center rounded-md px-8 text-sm font-medium transition-colors"
						>
							Entrar no sistema
						</Link>
					</div>
				</section>

				<footer className="text-muted-foreground pb-[max(0.5rem,env(safe-area-inset-bottom))] text-center text-xs">
					Uso interno da clínica · fisiogeovane.com.br
				</footer>
			</div>
		</main>
	);
}
