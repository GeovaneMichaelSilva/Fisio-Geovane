import Image from "next/image";

import { cn } from "@/utils";

import type { FC, HTMLAttributes } from "react";

type AuthBrandProps = HTMLAttributes<HTMLDivElement>;

/**
 * Marca (símbolo) nas telas de autenticação.
 */
const AuthBrand: FC<AuthBrandProps> = (props) => {
	const { className, ...restProps } = props;

	return (
		<div
			className={cn("flex flex-col items-center pb-2", className)}
			{...restProps}
		>
			<Image
				src="/brand/logo-mark.png"
				alt="Geovane M. da Silva — Fisioterapeuta"
				width={160}
				height={160}
				priority
				className="size-[112px] object-contain sm:size-[128px]"
			/>
		</div>
	);
};

export default AuthBrand;
