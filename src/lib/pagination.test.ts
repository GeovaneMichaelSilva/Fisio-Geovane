import { describe, expect, it } from "vitest";

import {
	DEFAULT_PAGE_SIZE,
	paginationMeta,
	parsePagination
} from "./pagination";

describe("parsePagination", () => {
	it("usa defaults sem query", () => {
		expect(parsePagination(new URLSearchParams())).toEqual({
			page: 1,
			pageSize: DEFAULT_PAGE_SIZE
		});
	});

	it("aceita page e pageSize válidos", () => {
		expect(
			parsePagination(new URLSearchParams({ page: "3", pageSize: "50" }))
		).toEqual({ page: 3, pageSize: 50 });
	});

	it("cai no default se valores forem inválidos", () => {
		expect(
			parsePagination(new URLSearchParams({ page: "0", pageSize: "999" }))
		).toEqual({ page: 1, pageSize: DEFAULT_PAGE_SIZE });
	});
});

describe("paginationMeta", () => {
	it("calcula offset e totalPages", () => {
		expect(paginationMeta(45, 2, 20)).toEqual({
			page: 2,
			pageSize: 20,
			total: 45,
			totalPages: 3,
			hasMore: true,
			offset: 20
		});
	});

	it("ajusta page além do total", () => {
		const meta = paginationMeta(10, 9, 20);
		expect(meta.page).toBe(1);
		expect(meta.hasMore).toBe(false);
		expect(meta.offset).toBe(0);
	});

	it("trata lista vazia com ao menos 1 página", () => {
		expect(paginationMeta(0, 1, 20).totalPages).toBe(1);
	});
});
