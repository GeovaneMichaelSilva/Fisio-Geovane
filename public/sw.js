/* Service worker mínimo — critério de instalação PWA (Android/Chrome).
 * Não implementa cache offline de dados clínicos. */
self.addEventListener("install", (event) => {
	event.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", (event) => {
	event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", () => {
	/* no-op: rede sempre; handler presente só para installability */
});
