"use client";

import { useState } from "react";
import { SessionProvider } from "next-auth/react";
import { Toaster } from "sonner";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

export function Providers({ children }: { children: React.ReactNode }) {
	const [queryClient] = useState(
		() =>
			new QueryClient({
				defaultOptions: {
					queries: {
						staleTime: 30_000,
						retry: 1
					}
				}
			})
	);

	return (
		<SessionProvider>
			<QueryClientProvider client={queryClient}>
				{children}
				<Toaster richColors position="top-center" closeButton />
			</QueryClientProvider>
		</SessionProvider>
	);
}
