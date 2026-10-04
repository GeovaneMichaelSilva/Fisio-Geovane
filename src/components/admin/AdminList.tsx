import { cn } from "@/utils";

import type { ComponentPropsWithoutRef, FC } from "react";

type AdminListProps = ComponentPropsWithoutRef<"ul">;

/**
 * Lista admin com itens bem separados (borda em cada linha).
 */
const AdminList: FC<AdminListProps> = (props) => {
	const { className, ...restProps } = props;
	return (
		<ul className={cn("flex flex-col gap-2", className)} {...restProps} />
	);
};

type AdminListItemProps = ComponentPropsWithoutRef<"li">;

/**
 * Item de lista com borda — padrão visual das listagens do admin.
 */
const AdminListItem: FC<AdminListItemProps> = (props) => {
	const { className, ...restProps } = props;
	return (
		<li
			className={cn(
				"border-border bg-card flex flex-col gap-3 rounded-lg border px-3 py-3",
				"sm:flex-row sm:items-center sm:justify-between",
				className
			)}
			{...restProps}
		/>
	);
};

export { AdminList, AdminListItem };
