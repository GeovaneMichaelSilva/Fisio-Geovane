"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { AdminList, AdminListItem } from "@/components/admin/AdminList";
import { ListSkeleton } from "@/components/admin/LoadingStates";
import {
	EmptyState,
	ErrorState,
	PageHeader
} from "@/components/admin/PageStates";
import SettingsNav from "@/components/admin/SettingsNav";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle
} from "@/components/ui/Card";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle
} from "@/components/ui/Dialog";
import { Input } from "@/components/ui/Input";
import { useClinicRole } from "@/hooks/useClinicRole";
import { usePageTitle } from "@/hooks/usePageTitle";
import {
	serviceTypeFormSchema,
	type ServiceTypeFormParsed,
	type ServiceTypeFormValues
} from "@/lib/service-types/schema";

import type { FC, ReactNode } from "react";

type ServiceType = {
	id: string;
	name: string;
	slug: string;
	defaultDurationMinutes: number;
	defaultValueBrl: string;
	isActive: boolean;
	sortOrder: number;
};

const fetchTypes = async (): Promise<ServiceType[]> => {
	const res = await fetch("/api/admin/service-types");
	const json = await res.json();
	if (!res.ok) throw new Error(json.error || "Falha ao carregar.");
	return json.data;
};

const formatBrl = (value: string | number) => {
	const n = typeof value === "string" ? Number(value) : value;
	return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
};

const emptyForm: ServiceTypeFormValues = {
	name: "",
	defaultDurationMinutes: 50,
	defaultValueBrl: 220,
	isActive: true
};

const ServiceTypesPage: FC = () => {
	usePageTitle("Tipos de atendimento");
	const queryClient = useQueryClient();
	const { isOwner } = useClinicRole();
	const [open, setOpen] = useState(false);
	const [editingId, setEditingId] = useState<string | null>(null);

	const listQuery = useQuery({
		queryKey: ["service-types"],
		queryFn: fetchTypes
	});

	const form = useForm<ServiceTypeFormValues, unknown, ServiceTypeFormParsed>({
		resolver: zodResolver(serviceTypeFormSchema),
		defaultValues: emptyForm,
		mode: "all"
	});

	const openCreate = () => {
		setEditingId(null);
		form.reset(emptyForm);
		setOpen(true);
	};

	const openEdit = (row: ServiceType) => {
		setEditingId(row.id);
		form.reset({
			name: row.name,
			defaultDurationMinutes: row.defaultDurationMinutes,
			defaultValueBrl: Number(row.defaultValueBrl),
			isActive: row.isActive
		});
		setOpen(true);
	};

	const saveMutation = useMutation({
		mutationFn: async (values: ServiceTypeFormParsed) => {
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
			setOpen(false);
			setEditingId(null);
			form.reset(emptyForm);
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

	const pageDescription = isOwner
		? "Nome, duração e valor padrão usados na agenda e nos pacientes."
		: "Consulta dos tipos. Somente o responsável pode criar ou editar.";

	let listBody: ReactNode;
	if (listQuery.isLoading) {
		listBody = <ListSkeleton />;
	} else if (listQuery.isError) {
		listBody = (
			<ErrorState
				message={(listQuery.error as Error).message}
				onRetry={() => listQuery.refetch()}
			/>
		);
	} else if (listQuery.data?.length === 0) {
		listBody = (
			<EmptyState
				title="Nenhum tipo cadastrado"
				description={
					isOwner
						? "Crie o primeiro tipo para usar na agenda."
						: "Peça ao responsável para cadastrar os tipos."
				}
				action={
					isOwner ? (
						<Button type="button" size="sm" onClick={openCreate}>
							Novo tipo
						</Button>
					) : undefined
				}
			/>
		);
	} else {
		listBody = (
			<AdminList>
				{listQuery.data?.map((row) => (
					<AdminListItem key={row.id}>
						<div className="min-w-0 space-y-1">
							<div className="flex flex-wrap items-center gap-2">
								<p className="font-medium">{row.name}</p>
								<Badge variant={row.isActive ? "default" : "secondary"}>
									{row.isActive ? "Ativo" : "Inativo"}
								</Badge>
							</div>
							<p className="text-muted-foreground text-sm">
								{row.defaultDurationMinutes} min · {formatBrl(row.defaultValueBrl)}
							</p>
						</div>
						{isOwner ? (
							<div className="flex flex-wrap gap-2">
								<Button
									type="button"
									variant="outline"
									size="sm"
									onClick={() => openEdit(row)}
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
						) : null}
					</AdminListItem>
				))}
			</AdminList>
		);
	}

	const dialogTitle = editingId ? "Editar tipo" : "Novo tipo";
	const dialogDescription = editingId
		? "Altere e salve. O slug é recalculado pelo nome."
		: "Cadastre um novo tipo de atendimento.";

	let submitLabel = "Criar tipo";
	if (saveMutation.isPending) submitLabel = "Salvando…";
	else if (editingId) submitLabel = "Salvar";

	return (
		<div className="space-y-6">
			<div className="space-y-3">
				<PageHeader
					title="Tipos de atendimento"
					description={pageDescription}
					actions={
						isOwner ? (
							<Button type="button" onClick={openCreate}>
								Novo tipo
							</Button>
						) : undefined
					}
				/>
				<SettingsNav />
			</div>

			<Card>
				<CardHeader>
					<CardTitle>Cadastrados</CardTitle>
					<CardDescription>
						Tipos inativos não aparecem em novos agendamentos.
					</CardDescription>
				</CardHeader>
				<CardContent>{listBody}</CardContent>
			</Card>

			<Dialog
				open={open}
				onOpenChange={(next) => {
					setOpen(next);
					if (!next) {
						setEditingId(null);
						form.reset(emptyForm);
					}
				}}
			>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>{dialogTitle}</DialogTitle>
						<DialogDescription>{dialogDescription}</DialogDescription>
					</DialogHeader>
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
						<DialogFooter>
							<Button
								type="button"
								variant="outline"
								onClick={() => setOpen(false)}
							>
								Cancelar
							</Button>
							<Button type="submit" disabled={saveMutation.isPending}>
								{submitLabel}
							</Button>
						</DialogFooter>
					</form>
				</DialogContent>
			</Dialog>
		</div>
	);
};

export default ServiceTypesPage;
