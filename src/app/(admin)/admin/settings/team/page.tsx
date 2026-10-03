"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { FormSkeleton, ListSkeleton } from "@/components/admin/LoadingStates";
import {
	EmptyState,
	ErrorState,
	PageHeader
} from "@/components/admin/PageStates";
import { SettingsNav } from "@/components/admin/SettingsNav";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger
} from "@/components/ui/AlertDialog";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle
} from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { useClinicRole } from "@/hooks/useClinicRole";
import { usePageTitle } from "@/hooks/usePageTitle";
import {
	teamMemberCreateSchema,
	type TeamMemberCreateInput,
	type TeamMemberCreateParsed
} from "@/lib/team/schema";

type TeamMember = {
	userId: string;
	fullName: string;
	email: string;
	role: "owner" | "staff";
	createdAt: string;
	isSelf: boolean;
};

async function fetchTeam() {
	const res = await fetch("/api/admin/team");
	const json = await res.json();
	if (!res.ok) throw new Error(json.error || "Falha ao listar equipe.");
	return json.data as TeamMember[];
}

const ROLE_LABEL = {
	owner: "Responsável",
	staff: "Equipe"
} as const;

export default function TeamSettingsPage() {
	usePageTitle("Equipe");
	const queryClient = useQueryClient();
	const { isOwner, isLoading: roleLoading } = useClinicRole();
	const [removingId, setRemovingId] = useState<string | null>(null);

	const listQuery = useQuery({
		queryKey: ["team"],
		queryFn: fetchTeam
	});

	const form = useForm<TeamMemberCreateInput, unknown, TeamMemberCreateParsed>({
		resolver: zodResolver(teamMemberCreateSchema),
		defaultValues: {
			fullName: "",
			email: "",
			password: "",
			role: "staff"
		}
	});

	const createMutation = useMutation({
		mutationFn: async (values: TeamMemberCreateParsed) => {
			const res = await fetch("/api/admin/team", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(values)
			});
			const json = await res.json();
			if (!res.ok) throw new Error(json.error || "Falha ao adicionar.");
			return json.data as TeamMember;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["team"] });
			form.reset({
				fullName: "",
				email: "",
				password: "",
				role: "staff"
			});
			toast.success("Membro adicionado. Informe o e-mail e a senha a ele.");
		},
		onError: (err: Error) => toast.error(err.message)
	});

	const removeMutation = useMutation({
		mutationFn: async (userId: string) => {
			const res = await fetch(`/api/admin/team/${userId}`, {
				method: "DELETE"
			});
			const json = await res.json();
			if (!res.ok) throw new Error(json.error || "Falha ao remover.");
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["team"] });
			toast.success("Membro removido.");
			setRemovingId(null);
		},
		onError: (err: Error) => toast.error(err.message)
	});

	if (!roleLoading && !isOwner) {
		return (
			<div className="space-y-6">
				<div className="space-y-3">
					<PageHeader
						title="Equipe"
						description="Gerencie quem acessa o sistema da clínica."
					/>
					<SettingsNav />
				</div>
				<EmptyState
					title="Acesso restrito"
					description="Apenas o responsável da clínica pode gerenciar a equipe."
				/>
			</div>
		);
	}

	return (
		<div className="space-y-6">
			<div className="space-y-3">
				<PageHeader
					title="Equipe"
					description="Adicione secretária ou colaboradores com acesso ao sistema."
				/>
				<SettingsNav />
			</div>

			<Card>
				<CardHeader>
					<CardTitle>Membros</CardTitle>
					<CardDescription>
						Responsável tem acesso total. Equipe agenda, atende e vê
						financeiro; não altera configurações nem Google Agenda.
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					{listQuery.isLoading ? (
						<ListSkeleton />
					) : listQuery.isError ? (
						<ErrorState
							message={(listQuery.error as Error).message}
							onRetry={() => listQuery.refetch()}
						/>
					) : (
						<ul className="divide-border divide-y">
							{(listQuery.data ?? []).map((m) => (
								<li
									key={m.userId}
									className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between"
								>
									<div className="min-w-0 space-y-1">
										<div className="flex flex-wrap items-center gap-2">
											<p className="font-medium">{m.fullName}</p>
											<Badge variant={m.role === "owner" ? "default" : "secondary"}>
												{ROLE_LABEL[m.role]}
											</Badge>
											{m.isSelf ? (
												<Badge variant="outline">Você</Badge>
											) : null}
										</div>
										<p className="text-muted-foreground text-sm">{m.email}</p>
									</div>
									{!m.isSelf ? (
										<AlertDialog
											open={removingId === m.userId}
											onOpenChange={(open) =>
												setRemovingId(open ? m.userId : null)
											}
										>
											<AlertDialogTrigger asChild>
												<Button
													type="button"
													variant="ghost"
													size="sm"
													className="min-h-11 sm:min-h-9"
												>
													Remover
												</Button>
											</AlertDialogTrigger>
											<AlertDialogContent>
												<AlertDialogHeader>
													<AlertDialogTitle>Remover da equipe?</AlertDialogTitle>
													<AlertDialogDescription>
														{m.fullName} ({m.email}) perderá o acesso a esta
														clínica.
													</AlertDialogDescription>
												</AlertDialogHeader>
												<AlertDialogFooter>
													<AlertDialogCancel
														disabled={removeMutation.isPending}
													>
														Cancelar
													</AlertDialogCancel>
													<AlertDialogAction
														disabled={removeMutation.isPending}
														onClick={(e) => {
															e.preventDefault();
															removeMutation.mutate(m.userId);
														}}
													>
														{removeMutation.isPending
															? "Removendo…"
															: "Remover"}
													</AlertDialogAction>
												</AlertDialogFooter>
											</AlertDialogContent>
										</AlertDialog>
									) : null}
								</li>
							))}
						</ul>
					)}
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle>Adicionar membro</CardTitle>
					<CardDescription>
						Crie o acesso com senha temporária e passe as credenciais à pessoa.
					</CardDescription>
				</CardHeader>
				<CardContent>
					{roleLoading ? (
						<FormSkeleton />
					) : (
						<form
							className="grid max-w-xl gap-4"
							onSubmit={form.handleSubmit((values) =>
								createMutation.mutate(values)
							)}
							noValidate
						>
							<Input
								label={{ text: "Nome", required: true }}
								error={form.formState.errors.fullName?.message}
								{...form.register("fullName")}
							/>
							<Input
								label={{ text: "E-mail", required: true }}
								type="email"
								autoComplete="off"
								error={form.formState.errors.email?.message}
								{...form.register("email")}
							/>
							<Input
								label={{ text: "Senha temporária", required: true }}
								type="password"
								autoComplete="new-password"
								helperText="Mínimo 8 caracteres. A pessoa pode trocar depois em Esqueci a senha."
								error={form.formState.errors.password?.message}
								{...form.register("password")}
							/>
							<Select
								label={{ text: "Papel", required: true }}
								error={form.formState.errors.role?.message}
								options={[
									{ value: "staff", label: "Equipe" },
									{ value: "owner", label: "Responsável" }
								]}
								{...form.register("role")}
							/>
							<div>
								<Button
									type="submit"
									className="min-h-11 sm:min-h-10"
									disabled={createMutation.isPending}
								>
									{createMutation.isPending ? "Adicionando…" : "Adicionar"}
								</Button>
							</div>
						</form>
					)}
				</CardContent>
			</Card>
		</div>
	);
}
