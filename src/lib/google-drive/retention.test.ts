import { afterEach, describe, expect, it } from "vitest";

import {
	authorizeCronRequest,
	BACKUP_RETENTION_DAYS,
	buildBackupFileName,
	filesOlderThanRetention
} from "./retention";

describe("filesOlderThanRetention", () => {
	const now = new Date("2026-10-04T12:00:00.000Z");

	it("mantém arquivos dentro da janela de 30 dias", () => {
		const files = [
			{
				id: "new",
				name: "fisio-backup-a.json",
				createdTime: "2026-09-20T12:00:00.000Z"
			},
			{
				id: "edge",
				name: "fisio-backup-b.json",
				createdTime: "2026-09-04T12:00:00.000Z"
			}
		];
		expect(filesOlderThanRetention(files, now)).toEqual([]);
	});

	it("marca como antigos os arquivos fora dos 30 dias", () => {
		const files = [
			{
				id: "old",
				name: "fisio-backup-old.json",
				createdTime: "2026-08-01T12:00:00.000Z"
			},
			{
				id: "keep",
				name: "fisio-backup-keep.json",
				createdTime: "2026-09-20T12:00:00.000Z"
			}
		];
		const stale = filesOlderThanRetention(files, now, BACKUP_RETENTION_DAYS);
		expect(stale.map((f) => f.id)).toEqual(["old"]);
	});

	it("ignora arquivos sem createdTime válido", () => {
		expect(
			filesOlderThanRetention(
				[
					{ id: "x", name: "a.json" },
					{ id: "y", name: "b.json", createdTime: "not-a-date" }
				],
				now
			)
		).toEqual([]);
	});
});

describe("buildBackupFileName", () => {
	it("usa prefixo e clinicId curto", () => {
		const name = buildBackupFileName(
			"abcdef12-9999-4000-8000-000000000001",
			new Date("2026-10-04T03:00:00.000Z")
		);
		expect(name.startsWith("fisio-backup-abcdef12-")).toBe(true);
		expect(name.endsWith(".json")).toBe(true);
	});
});

describe("authorizeCronRequest", () => {
	const prev = process.env.CRON_SECRET;

	afterEach(() => {
		if (prev === undefined) delete process.env.CRON_SECRET;
		else process.env.CRON_SECRET = prev;
	});

	it("rejeita sem CRON_SECRET", () => {
		delete process.env.CRON_SECRET;
		const req = new Request("http://localhost/api/cron/backup-drive", {
			headers: { Authorization: "Bearer x" }
		});
		expect(authorizeCronRequest(req)).toBe(false);
	});

	it("aceita Bearer correto", () => {
		process.env.CRON_SECRET = "test-secret";
		const req = new Request("http://localhost/api/cron/backup-drive", {
			headers: { Authorization: "Bearer test-secret" }
		});
		expect(authorizeCronRequest(req)).toBe(true);
	});

	it("rejeita Bearer incorreto", () => {
		process.env.CRON_SECRET = "test-secret";
		const req = new Request("http://localhost/api/cron/backup-drive", {
			headers: { Authorization: "Bearer wrong" }
		});
		expect(authorizeCronRequest(req)).toBe(false);
	});
});
