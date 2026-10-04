"use client";

import { FormSkeleton } from "@/components/admin/LoadingStates";
import { ErrorState } from "@/components/admin/PageStates";
import { Button } from "@/components/ui/Button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle
} from "@/components/ui/Card";
import { Select } from "@/components/ui/Select";

import type { IntegrationServiceType } from "./integrationsApi";
import type { FC, ReactNode } from "react";

type TypeMappingSectionProps = {
	types: IntegrationServiceType[] | undefined;
	typesLoading: boolean;
	typesError: Error | null;
	onTypesRetry: () => void;
	calendarsLoading: boolean;
	calendarOptions: Array<{ value: string; label: string }>;
	typeMaps: Record<string, string>;
	onTypeMapChange: (serviceTypeId: string, googleCalendarId: string) => void;
	savePending: boolean;
	onSave: () => void;
};

const TypeMappingSection: FC<TypeMappingSectionProps> = (props) => {
	const {
		types,
		typesLoading,
		typesError,
		onTypesRetry,
		calendarsLoading,
		calendarOptions,
		typeMaps,
		onTypeMapChange,
		savePending,
		onSave
	} = props;

	let mappingBody: ReactNode;
	if (typesLoading || calendarsLoading) {
		mappingBody = <FormSkeleton />;
	} else if (typesError) {
		mappingBody = (
			<ErrorState message={typesError.message} onRetry={onTypesRetry} />
		);
	} else {
		mappingBody = (
			<ul className="space-y-3">
				{(types ?? []).map((t) => (
					<li
						key={t.id}
						className="grid gap-2 sm:grid-cols-[1fr_1.2fr] sm:items-end"
					>
						<div>
							<p className="text-sm font-medium">{t.name}</p>
							<p className="text-muted-foreground text-xs">
								{t.isActive ? "Ativo" : "Inativo"}
							</p>
						</div>
						<Select
							label={{ text: "Agenda Google" }}
							value={typeMaps[t.id] ?? ""}
							options={calendarOptions}
							onChange={(e) => onTypeMapChange(t.id, e.target.value)}
						/>
					</li>
				))}
			</ul>
		);
	}

	return (
		<Card>
			<CardHeader>
				<CardTitle>Tipo → agenda Google</CardTitle>
				<CardDescription>
					Cada tipo (Domiciliar, Ortopédico…) pode ir para uma agenda diferente.
					Deixe em branco para usar a agenda padrão.
				</CardDescription>
			</CardHeader>
			<CardContent className="space-y-4">
				{mappingBody}
				<Button
					type="button"
					className="min-h-11 sm:min-h-10"
					disabled={savePending}
					onClick={onSave}
				>
					{savePending ? "Salvando…" : "Salvar mapeamento"}
				</Button>
			</CardContent>
		</Card>
	);
};

export default TypeMappingSection;
