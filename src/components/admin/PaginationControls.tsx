"use client";

import { Button } from "@/components/ui/Button";

type PaginationControlsProps = {
	page: number;
	totalPages: number;
	total: number;
	pageSize: number;
	pending?: boolean;
	onPageChange: (page: number) => void;
};

/**
 * Controles de paginação simples (anterior / próxima + contagem).
 */
export function PaginationControls({
	page,
	totalPages,
	total,
	pageSize,
	pending = false,
	onPageChange
}: PaginationControlsProps) {
	if (total === 0) return null;

	const from = (page - 1) * pageSize + 1;
	const to = Math.min(page * pageSize, total);

	return (
		<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
			<p className="text-muted-foreground text-sm">
				{from}–{to} de {total}
			</p>
			<div className="flex flex-wrap gap-2">
				<Button
					type="button"
					variant="outline"
					size="sm"
					className="min-h-11 sm:min-h-9"
					disabled={pending || page <= 1}
					onClick={() => onPageChange(page - 1)}
				>
					Anterior
				</Button>
				<span className="text-muted-foreground flex min-h-11 items-center px-2 text-sm sm:min-h-9">
					Página {page} / {totalPages}
				</span>
				<Button
					type="button"
					variant="outline"
					size="sm"
					className="min-h-11 sm:min-h-9"
					disabled={pending || page >= totalPages}
					onClick={() => onPageChange(page + 1)}
				>
					Próxima
				</Button>
			</div>
		</div>
	);
}
