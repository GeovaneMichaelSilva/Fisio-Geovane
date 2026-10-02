"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { z } from "zod";

import { SettingsNav } from "@/components/admin/SettingsNav";
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
import { Skeleton } from "@/components/ui/Skeleton";
import { usePageTitle } from "@/hooks/usePageTitle";

type ServiceType = {
	id: string;
	name: string;
	slug: string;
	defaultDurationMinutes: number;
	defaultValueBrl: string;
	isActive: boolean;
	sortOrder: number;
};

const formSchema = z.object({
	name: z.string().trim().min(1, "Nome obrigatório.").max(80),
	defaultDurationMinutes: z
		.number({ error: "Informe a duração." })
		.int()
		.min(5, "Mínimo 5 minutos.")
		.max(480),
	defaultValueBrl: z
		.number({ error: "Informe o valor." })
		.min(0, "Valor inválido.")
		.max(999_999.99),
	isActive: z.boolean()
});

type FormValues = z.infer<typeof formSchema>;

async function fetchTypes(): Promise<ServiceType[]> {
	const res = await fetch("/api/admin/service-types");
	const json = await res.json();
	if (!res.ok) throw new Error(json.error || "Falha ao carregar.");
	return json.data;
}

function formatBrl(value: string | number) {
	const n = typeof value === "string" ? Number(value) : value;
	return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default function ServiceTypesPage() {
	usePageTitle("Tipos de atendimento");
	const queryClient = useQueryClient();
	const [editingId, setEditingId] = useState<string | null>(null);

	const listQuery = useQuery({
		queryKey: ["service-types"],
		queryFn: fetchTypes
	});

	const form = useForm<FormValues>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			name: "",
			defaultDurationMinutes: 50,
			defaultValueBrl: 220,
			isActive: true
		}
	});

	useEffect(() => {
		if (!editingId || !listQuery.data) return;
		const row = listQuery.data.find((t) => t.id === editingId);
		if (!row) return;
		form.reset({
			name: row.name,
			defaultDurationMinutes: row.defaultDurationMinutes,
			defaultValueBrl: Number(row.defaultValueBrl),
			isActive: row.isActive
		});
	}, [editingId, listQuery.data, form]);

	function startCreate() {
		setEditingId(null);
		form.reset({
			name: "",
			defaultDurationMinutes: 50,
			defaultValueBrl: 220,
			isActive: true
		});
	}

	const saveMutation = useMutation({
		mutationFn: async (values: FormValues) => {
			if (editingId) {
				const res = await fetch(`/api/admin/service-types/${editingId}`, {
					method: "PATCH",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify(values)
				});
				const json = await res.json();
				if (!res.ok) throw new Error(json.error || "Falha ao atualizar.");
				return json.data as ServiceType;
			}

			const res = await fetch("/api/admin/service-types", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(values)
			});
			const json = await res.json();
			if (!res.ok) throw new Error(json.error || "Falha ao criar.");
			return json.data as ServiceType;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["service-types"] });
			toast.success(editingId ? "Tipo atualizado." : "Tipo criado.");
			startCreate();
		},
		onError: (err: Error) => toast.error(err.message)
	});

	const toggleMutation = useMutation({
		mutationFn: async (row: ServiceType) => {
			const res = await fetch(`/api/admin/service-types/${row.id}`, {
				method: "PATCH",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ isActive: !row.isActive })
			});
			const json = await res.json();
			if (!res.ok) throw new Error(json.error || "Falha ao alterar status.");
			return json.data as ServiceType;
		},
		onSuccess: (data) => {
			queryClient.invalidateQueries({ queryKey: ["service-types"] });
			toast.success(data.isActive ? "Tipo ativado." : "Tipo desativado.");
		},
		onError: (err: Error) => toast.error(err.message)
	});

	return (
		<div className="space-y-6">
			<div className="space-y-3">
				<div>
					<h1 className="text-2xl font-medium">Tipos de atendimento</h1>
					<p className="text-muted-foreground text-sm">
						Nome, duração e valor padrão usados na agenda e nos pacientes.
					</p>
				</div>
				<SettingsNav />
			</div>

			<div className="grid gap-6 lg:grid-cols-[1fr_360px]">
				<Card>
					<CardHeader>
						<CardTitle>Cadastrados</CardTitle>
						<CardDescription>
							Tipos inativos não aparecem em novos agendamentos.
						</CardDescription>
					</CardHeader>
					<CardContent>
						{listQuery.isLoading ? (
							<div className="space-y-2">
								<Skeleton className="h-12 w-full" />
								<Skeleton className="h-12 w-full" />
								<Skeleton className="h-12 w-full" />
							</div>
						) : listQuery.isError ? (
							<p className="text-destructive text-sm" role="alert">
								{(listQuery.error as Error).message}
							</p>
						) : listQuery.data?.length === 0 ? (
							<p className="text-muted-foreground text-sm">
								Nenhum tipo cadastrado ainda.
							</p>
						) : (
							<ul className="divide-border divide-y">
								{listQuery.data?.map((row) => (
									<li
										key={row.id}
										className="flex flex-col gap-3 py-3 sm:flex-row sm:items-center sm:justify-between"
									>
										<div className="min-w-0 space-y-1">
											<div className="flex flex-wrap items-center gap-2">
												<p className="font-medium">{row.name}</p>
												<Badge
													variant={row.isActive ? "default" : "secondary"}
												>
													{row.isActive ? "Ativo" : "Inativo"}
												</Badge>
											</div>
											<p className="text-muted-foreground text-sm">
												{row.defaultDurationMinutes} min ·{" "}
												{formatBrl(row.defaultValueBrl)}
											</p>
										</div>
										<div className="flex flex-wrap gap-2">
											<Button
												type="button"
												variant="outline"
												size="sm"
												onClick={() => setEditingId(row.id)}
											>
												Editar
											</Button>
											<Button
												type="button"
												variant="ghost"
												size="sm"
												disabled={toggleMutation.isPending}
												onClick={() => toggleMutation.mutate(row)}
											>
												{row.isActive ? "Desativar" : "Ativar"}
											</Button>
										</div>
									</li>
								))}
							</ul>
						)}
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle>{editingId ? "Editar tipo" : "Novo tipo"}</CardTitle>
						<CardDescription>
							{editingId
								? "Altere e salve. O slug é recalculado pelo nome."
								: "Cadastre um novo tipo de atendimento."}
						</CardDescription>
					</CardHeader>
					<CardContent>
						<form
							className="space-y-4"
							onSubmit={form.handleSubmit((values) =>
								saveMutation.mutate(values)
							)}
						>
							<Input
								label={{ text: "Nome", required: true }}
								error={form.formState.errors.name?.message}
								{...form.register("name")}
							/>
							<Input
								label={{ text: "Duração padrão (min)", required: true }}
								type="number"
								min={5}
								max={480}
								error={form.formState.errors.defaultDurationMinutes?.message}
								{...form.register("defaultDurationMinutes", {
									valueAsNumber: true
								})}
							/>
							<Input
								label={{ text: "Valor padrão (R$)", required: true }}
								type="number"
								min={0}
								step="0.01"
								error={form.formState.errors.defaultValueBrl?.message}
								{...form.register("defaultValueBrl", { valueAsNumber: true })}
							/>
							<label className="flex items-center gap-2 text-sm">
								<input
									type="checkbox"
									className="border-input size-4 rounded"
									{...form.register("isActive")}
								/>
								Ativo
							</label>
							<div className="flex flex-wrap gap-2">
								<Button type="submit" disabled={saveMutation.isPending}>
									{saveMutation.isPending
										? "Salvando…"
										: editingId
											? "Salvar alterações"
											: "Criar tipo"}
								</Button>
								{editingId ? (
									<Button
										type="button"
										variant="ghost"
										onClick={startCreate}
									>
										Cancelar
									</Button>
								) : null}
							</div>
						</form>
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
