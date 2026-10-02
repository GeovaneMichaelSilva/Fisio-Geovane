"use client";

import { useEffect } from "react";

const APP_SUFFIX = " · Geovane Michael da Silva";

/**
 * Define document.title no client (páginas admin são client-first).
 */
export function usePageTitle(title: string) {
	useEffect(() => {
		document.title = `${title}${APP_SUFFIX}`;
	}, [title]);
}
