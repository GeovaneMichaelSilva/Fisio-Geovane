import { describe, expect, it } from "vitest";

import { slugify } from "./slug";

describe("slugify", () => {
	it("remove acentos e normaliza", () => {
		expect(slugify("Fisioterapia Pediátrica")).toBe("fisioterapia-pediatrica");
	});

	it("colapsa separadores e trim", () => {
		expect(slugify("  Avaliação  --  Inicial  ")).toBe("avaliacao-inicial");
	});
});
