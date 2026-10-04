"use client";

import { useState } from "react";
import { SessionProvider } from "next-auth/react";
import { Toaster } from "sonner";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import type { ComponentPropsWithoutRef, FC, ReactNode } from "react";

type ProvidersProps = {
	children: ReactNode;
} & Omit<ComponentPropsWithoutRef<typeof SessionProvider>, "children">;

const Providers: FC<ProvidersProps> = (props) => {
	const { children, ...restProps } = props;
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
		<SessionProvider {...restProps}>
			<QueryClientProvider client={queryClient}>
				{children}
				<Toaster richColors position="top-center" closeButton />
			</QueryClientProvider>
		</SessionProvider>
	);
};

export default Providers;
