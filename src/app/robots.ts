import type { MetadataRoute } from "next";

/**
 * Indica aos buscadores para não indexar área interna / auth / APIs.
 * Complementa o `robots: { index: false }` das páginas.
 */
export default function robots(): MetadataRoute.Robots {
	return {
		rules: {
			userAgent: "*",
			allow: "/",
			disallow: [
				"/admin",
				"/admin/",
				"/login",
				"/forgot-password",
				"/update-password",
				"/api/"
			]
		}
	};
}
