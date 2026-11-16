"use client";

import { useEffect, useState } from "react";

type BeforeInstallPromptEvent = Event & {
	prompt: () => Promise<void>;
	userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

const isStandaloneDisplay = () => {
	if (typeof window === "undefined") return false;
	const mq = window.matchMedia("(display-mode: standalone)").matches;
	const iosStandalone =
		"standalone" in window.navigator &&
		Boolean((window.navigator as Navigator & { standalone?: boolean }).standalone);
	return mq || iosStandalone;
};

/**
 * Captura beforeinstallprompt (Android/Chrome) para botão "Instalar app".
 */
export const usePwaInstall = () => {
	const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(
		null
	);
	const [installed, setInstalled] = useState(false);

	useEffect(() => {
		setInstalled(isStandaloneDisplay());

		const onBeforeInstall = (event: Event) => {
			event.preventDefault();
			setDeferred(event as BeforeInstallPromptEvent);
		};
		const onInstalled = () => {
			setDeferred(null);
			setInstalled(true);
		};

		window.addEventListener("beforeinstallprompt", onBeforeInstall);
		window.addEventListener("appinstalled", onInstalled);
		return () => {
			window.removeEventListener("beforeinstallprompt", onBeforeInstall);
			window.removeEventListener("appinstalled", onInstalled);
		};
	}, []);

	const canInstall = Boolean(deferred) && !installed;

	const install = async () => {
		if (!deferred) return false;
		await deferred.prompt();
		const choice = await deferred.userChoice;
		setDeferred(null);
		if (choice.outcome === "accepted") {
			setInstalled(true);
			return true;
		}
		return false;
	};

	return { canInstall, installed, install };
};
