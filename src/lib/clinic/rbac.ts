import type { ClinicContext } from "@/lib/clinic/context";

/**
 * Exige papel owner na clínica atual.
 */
export const requireOwner = (ctx: ClinicContext): void => {
	if (ctx.role !== "owner") {
		throw new Response(
			JSON.stringify({
				error: "Apenas o responsável da clínica pode fazer isso."
			}),
			{
				status: 403,
				headers: { "Content-Type": "application/json" }
			}
		);
	}
}

export const isOwner = (ctx: ClinicContext) => {
	return ctx.role === "owner";
}
