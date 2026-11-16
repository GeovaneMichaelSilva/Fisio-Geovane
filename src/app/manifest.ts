import type { MetadataRoute } from "next";

/**
 * Manifest PWA — instalável a partir do admin (Android/Chrome).
 * Sem offline de dados; SW mínimo só atende critério de instalação.
 */
export default function manifest(): MetadataRoute.Manifest {
	return {
		name: "Fisio Geovane",
		short_name: "Fisio Geovane",
		description: "Gestão de atendimentos — Geovane Michael da Silva",
		start_url: "/admin",
		scope: "/",
		display: "standalone",
		orientation: "any",
		background_color: "#1f4d3a",
		theme_color: "#1f4d3a",
		lang: "pt-BR",
		icons: [
			{
				src: "/icons/icon-192.png",
				sizes: "192x192",
				type: "image/png",
				purpose: "any"
			},
			{
				src: "/icons/icon-512.png",
				sizes: "512x512",
				type: "image/png",
				purpose: "any"
			},
			{
				src: "/icons/icon-512.png",
				sizes: "512x512",
				type: "image/png",
				purpose: "maskable"
			}
		]
	};
}
