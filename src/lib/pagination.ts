import { z } from "zod";

export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

/**
 * Query de paginação offset-based (page começa em 1).
 */
export const paginationQuerySchema = z.object({
	page: z.coerce.number().int().min(1).default(1),
	pageSize: z.coerce
		.number()
		.int()
		.min(1)
		.max(MAX_PAGE_SIZE)
		.default(DEFAULT_PAGE_SIZE)
});

export type PaginationQuery = z.infer<typeof paginationQuerySchema>;

export const parsePagination = (searchParams: URLSearchParams): PaginationQuery => {
	const parsed = paginationQuerySchema.safeParse({
		page: searchParams.get("page") ?? undefined,
		pageSize: searchParams.get("pageSize") ?? undefined
	});
	if (!parsed.success) {
		return { page: 1, pageSize: DEFAULT_PAGE_SIZE };
	}
	return parsed.data;
}

export const paginationMeta = (
	total: number,
	page: number,
	pageSize: number
) => {
	const totalPages = Math.max(1, Math.ceil(total / pageSize));
	const safePage = Math.min(page, totalPages);
	return {
		page: safePage,
		pageSize,
		total,
		totalPages,
		hasMore: safePage < totalPages,
		offset: (safePage - 1) * pageSize
	};
}

export type PaginationMeta = ReturnType<typeof paginationMeta>;
