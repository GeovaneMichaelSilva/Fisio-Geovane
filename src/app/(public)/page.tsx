import Image from "next/image";

export const metadata = {
	title: "Em breve",
	robots: { index: false, follow: false }
};

export default function ComingSoonPage() {
	return (
		<main className="bg-background flex min-h-screen flex-col items-center justify-center gap-6 px-6 text-center">
			<Image
				src="/brand/logo.png"
				alt="Geovane Michael da Silva — Fisioterapeuta"
				width={160}
				height={160}
				priority
			/>
			<div className="space-y-2">
				<p className="text-brand text-xs font-medium tracking-[0.25em] uppercase">
					Geovane Michael da Silva
				</p>
				<h1 className="text-foreground text-3xl font-medium">Em breve</h1>
			</div>
		</main>
	);
}
