import Image from "next/image";

import { cn } from "@/utils";

import type { FC, HTMLAttributes } from "react";

type AuthBrandProps = HTMLAttributes<HTMLDivElement>;

/**
 * Logo completa (símbolo + nome) nas telas de autenticação.
 */
const AuthBrand: FC<AuthBrandProps> = (props) => {
	const { className, ...restProps } = props;

	return (
		<div
			className={cn("flex flex-col items-center pb-2", className)}
			{...restProps}
		>
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
};

export default AuthBrand;
