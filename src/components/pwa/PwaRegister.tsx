"use client";

import { useEffect } from "react";

import type { FC } from "react";

/**
 * Registra o service worker mínimo (necessário para instalar no Android/Chrome).
 */
const PwaRegister: FC = () => {
	useEffect(() => {
		if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
			return;
		}
		void navigator.serviceWorker.register("/sw.js").catch((err) => {
			console.error("[pwa] service worker register failed", err);
		});
	}, []);

	return null;
};

export default PwaRegister;
