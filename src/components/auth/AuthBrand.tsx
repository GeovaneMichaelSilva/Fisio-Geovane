import Image from "next/image";

/**
 * Logo + nome da marca nas telas de autenticação.
 */
export function AuthBrand() {
	return (
		<div className="flex flex-col items-center gap-3 pb-2">
			<Image
				src="/brand/logo.png"
				alt="Geovane Michael da Silva — Fisioterapeuta"
				width={140}
				height={140}
				priority
				className="rounded-md"
			/>
			<p className="text-brand text-xs font-medium tracking-[0.2em] uppercase">
				Geovane Michael da Silva
			</p>
		</div>
	);
}
