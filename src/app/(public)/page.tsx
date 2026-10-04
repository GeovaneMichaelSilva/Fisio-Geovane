import Image from "next/image";
import Link from "next/link";

export const metadata = {
	title: "Geovane Michael da Silva — Fisioterapeuta",
	description:
		"Fisioterapeuta Geovane Michael da Silva — Crefito 549225-F. Atendimento clínico.",
	robots: { index: true, follow: true }
};

/**
 * Landing pública — marca em primeiro plano.
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
			<div className="relative mx-auto flex min-h-dvh w-full max-w-3xl flex-col px-6 py-10 sm:px-8 sm:py-14">
				<section className="flex flex-1 flex-col items-center justify-center gap-8 pb-16 pt-6 text-center sm:gap-10">
					<div className="animate-in fade-in zoom-in-95 duration-700">
						<Image
							src="/brand/logo-full.png"
							alt="Geovane M. da Silva — Fisioterapeuta"
							width={320}
							height={400}
							priority
							className="mx-auto h-auto w-[200px] sm:w-[240px]"
						/>
					</div>

					<div className="animate-in fade-in slide-in-from-bottom-2 space-y-3 duration-700 delay-150 fill-mode-both">
						<h1 className="sr-only">Geovane Michael da Silva — Fisioterapeuta</h1>
						<p className="text-muted-foreground mx-auto max-w-md text-base sm:text-lg">
							Crefito 549225-F · atendimento clínico em fisioterapia.
						</p>
					</div>
				</section>

				<footer className="text-muted-foreground pb-[max(0.5rem,env(safe-area-inset-bottom))] space-y-2 text-center text-xs">
					<div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1">
						<Link
							href="/politica-de-privacidade"
							className="underline-offset-4 hover:underline"
						>
							Privacidade
						</Link>
						<span aria-hidden>·</span>
						<Link
							href="/termos-de-uso"
							className="underline-offset-4 hover:underline"
						>
							Termos de uso
						</Link>
					</div>
					<p>© 2026 Geovane Michael da Silva. Todos os direitos reservados.</p>
				</footer>
			</div>
		</main>
	);
}
