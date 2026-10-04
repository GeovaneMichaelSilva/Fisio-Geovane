import Image from "next/image";

/**
 * Logo completa (símbolo + nome) nas telas de autenticação.
 */
export function AuthBrand() {
	return (
		<div className="flex flex-col items-center pb-2">
			<Image
				src="/brand/logo-full.png"
				alt="Geovane M. da Silva — Fisioterapeuta"
				width={220}
				height={280}
				priority
				className="h-auto w-[160px] sm:w-[180px]"
			/>
		</div>
	);
}
