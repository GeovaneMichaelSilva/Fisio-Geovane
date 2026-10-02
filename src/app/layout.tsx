import { Montserrat } from "next/font/google";

import { Providers } from "@/providers/Providers";

import type { Metadata } from "next";

import "@/styles/styles.css";

const montserrat = Montserrat({
	variable: "--font-montserrat",
	subsets: ["latin"],
	display: "swap"
});

export const metadata: Metadata = {
	title: {
		default: "Fisio Geovane",
		template: "%s · Fisio Geovane"
	},
	description: "Gestão de atendimentos — Geovane Michael da Silva"
};

export default function RootLayout({
	children
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="pt-BR" className={`${montserrat.variable} h-full antialiased`}>
			<body className="bg-background text-foreground flex min-h-full flex-col font-sans">
				<Providers>{children}</Providers>
			</body>
		</html>
	);
}
