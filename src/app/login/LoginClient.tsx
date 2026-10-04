"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signIn } from "next-auth/react";

import AuthBrand from "@/components/auth/AuthBrand";
import { Button } from "@/components/ui/Button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle
} from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { loginSchema, type LoginValues } from "@/lib/auth/schema";

import type { FC, ReactNode } from "react";

const LoginClient: FC = () => {
	const router = useRouter();
	const searchParams = useSearchParams();
	const next = searchParams.get("next") || "/admin";
	const [authError, setAuthError] = useState<string | null>(null);

	const form = useForm<LoginValues>({
		resolver: zodResolver(loginSchema),
		defaultValues: { email: "", password: "" }
	});

	const onSubmit = async (values: LoginValues) => {
		setAuthError(null);
		const result = await signIn("credentials", {
			email: values.email,
			password: values.password,
			redirect: false
		});

		if (result?.error) {
			setAuthError("E-mail ou senha inválidos.");
			return;
		}

		router.replace(next);
		router.refresh();
	};

	let authErrorNode: ReactNode = null;
	if (authError) {
		authErrorNode = (
			<p className="text-destructive text-sm" role="alert">
				{authError}
			</p>
		);
	}

	let submitLabel = "Entrar";
	if (form.formState.isSubmitting) {
		submitLabel = "Entrando…";
	}

	return (
		<main className="bg-background flex min-h-screen items-center justify-center px-4">
			<Card className="w-full max-w-md">
				<CardHeader className="flex flex-col items-center text-center">
					<AuthBrand />
					<CardTitle as="h1" className="text-xl">
						Entrar
					</CardTitle>
					<CardDescription>Sistema interno</CardDescription>
				</CardHeader>
				<CardContent>
					<form
						onSubmit={form.handleSubmit(onSubmit)}
						className="space-y-4"
						noValidate
					>
						<Input
							label={{ text: "E-mail", required: true }}
							type="email"
							autoComplete="email"
							error={form.formState.errors.email?.message}
							{...form.register("email")}
						/>
						<Input
							label={{ text: "Senha", required: true }}
							type="password"
							autoComplete="current-password"
							error={form.formState.errors.password?.message}
							{...form.register("password")}
						/>
						{authErrorNode}
						<Button
							type="submit"
							className="w-full"
							disabled={form.formState.isSubmitting}
						>
							{submitLabel}
						</Button>
						<p className="text-muted-foreground text-center text-sm">
							<Link
								href="/forgot-password"
								className="text-primary hover:underline"
							>
								Esqueci a senha
							</Link>
						</p>
					</form>
				</CardContent>
			</Card>
		</main>
	);
};

export default LoginClient;
