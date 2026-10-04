import { sql } from "drizzle-orm";
import {
	boolean,
	check,
	date,
	index,
	integer,
	jsonb,
	numeric,
	pgEnum,
	pgTable,
	primaryKey,
	text,
	time,
	timestamp,
	unique,
	uniqueIndex,
	uuid
} from "drizzle-orm/pg-core";

export const userRoleEnum = pgEnum("user_role", ["owner", "staff"]);
export const sessionStatusEnum = pgEnum("session_status", [
	"scheduled",
	"completed",
	"canceled",
	"no_show"
]);

export const users = pgTable("users", {
	id: uuid("id").primaryKey().defaultRandom(),
	email: text("email").notNull().unique(),
	passwordHash: text("password_hash").notNull(),
	fullName: text("full_name").notNull(),
	role: userRoleEnum("role").notNull().default("owner"),
	createdAt: timestamp("created_at", { withTimezone: true })
		.notNull()
		.defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true })
		.notNull()
		.defaultNow()
});

export const passwordResetTokens = pgTable("password_reset_tokens", {
	id: uuid("id").primaryKey().defaultRandom(),
	userId: uuid("user_id")
		.notNull()
		.references(() => users.id, { onDelete: "cascade" }),
	tokenHash: text("token_hash").notNull().unique(),
	expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
	usedAt: timestamp("used_at", { withTimezone: true }),
	createdAt: timestamp("created_at", { withTimezone: true })
		.notNull()
		.defaultNow()
});

export const clinics = pgTable("clinics", {
	id: uuid("id").primaryKey().defaultRandom(),
	ownerUserId: uuid("owner_user_id")
		.notNull()
		.references(() => users.id),
	displayName: text("display_name").notNull(),
	professionLabel: text("profession_label").notNull().default("Fisioterapeuta"),
	licenseNumber: text("license_number"),
	timezone: text("timezone").notNull().default("America/Sao_Paulo"),
	defaultSessionDurationMinutes: integer("default_session_duration_minutes")
		.notNull()
		.default(50),
	createdAt: timestamp("created_at", { withTimezone: true })
		.notNull()
		.defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true })
		.notNull()
		.defaultNow()
});

export const clinicMembers = pgTable(
	"clinic_members",
	{
		clinicId: uuid("clinic_id")
			.notNull()
			.references(() => clinics.id, { onDelete: "cascade" }),
		userId: uuid("user_id")
			.notNull()
			.references(() => users.id, { onDelete: "cascade" }),
		role: userRoleEnum("role").notNull().default("owner")
	},
	(t) => [primaryKey({ columns: [t.clinicId, t.userId] })]
);

export const serviceTypes = pgTable(
	"service_types",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		clinicId: uuid("clinic_id")
			.notNull()
			.references(() => clinics.id, { onDelete: "cascade" }),
		name: text("name").notNull(),
		slug: text("slug").notNull(),
		defaultDurationMinutes: integer("default_duration_minutes")
			.notNull()
			.default(50),
		defaultValueBrl: numeric("default_value_brl", { precision: 10, scale: 2 })
			.notNull()
			.default("0"),
		isActive: boolean("is_active").notNull().default(true),
		sortOrder: integer("sort_order").notNull().default(0),
		/** Agenda Google deste tipo (null = agenda padrão da conexão). */
		googleCalendarId: text("google_calendar_id"),
		createdAt: timestamp("created_at", { withTimezone: true })
			.notNull()
			.defaultNow(),
		updatedAt: timestamp("updated_at", { withTimezone: true })
			.notNull()
			.defaultNow()
	},
	(t) => [
		unique().on(t.clinicId, t.slug),
		check(
			"service_types_duration_check",
			sql`${t.defaultDurationMinutes} between 5 and 480`
		),
		check("service_types_value_check", sql`${t.defaultValueBrl} >= 0`)
	]
);

export const patients = pgTable(
	"patients",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		clinicId: uuid("clinic_id")
			.notNull()
			.references(() => clinics.id, { onDelete: "cascade" }),
		fullName: text("full_name").notNull(),
		phone: text("phone"),
		cpf: text("cpf"),
		birthDate: date("birth_date"),
		weightKg: numeric("weight_kg", { precision: 5, scale: 2 }),
		heightCm: numeric("height_cm", { precision: 5, scale: 2 }),
		preferredServiceTypeId: uuid("preferred_service_type_id")
			.notNull()
			.references(() => serviceTypes.id),
		addressStreet: text("address_street"),
		addressNumber: text("address_number"),
		addressNeighborhood: text("address_neighborhood"),
		addressCity: text("address_city"),
		addressZip: text("address_zip"),
		notes: text("notes"),
		archivedAt: timestamp("archived_at", { withTimezone: true }),
		createdBy: uuid("created_by").references(() => users.id),
		createdAt: timestamp("created_at", { withTimezone: true })
			.notNull()
			.defaultNow(),
		updatedAt: timestamp("updated_at", { withTimezone: true })
			.notNull()
			.defaultNow()
	},
	(t) => [
		index("patients_clinic_name_idx").on(t.clinicId, t.fullName),
		index("patients_clinic_active_idx")
			.on(t.clinicId)
			.where(sql`${t.archivedAt} is null`),
		uniqueIndex("patients_clinic_cpf_uidx")
			.on(t.clinicId, t.cpf)
			.where(sql`${t.cpf} is not null and ${t.archivedAt} is null`),
		check("patients_name_check", sql`char_length(trim(${t.fullName})) > 0`),
		check(
			"patients_weight_check",
			sql`${t.weightKg} is null or (${t.weightKg} >= 1 and ${t.weightKg} <= 500)`
		),
		check(
			"patients_height_check",
			sql`${t.heightCm} is null or (${t.heightCm} >= 30 and ${t.heightCm} <= 250)`
		)
	]
);

export const sessions = pgTable(
	"sessions",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		clinicId: uuid("clinic_id")
			.notNull()
			.references(() => clinics.id, { onDelete: "cascade" }),
		patientId: uuid("patient_id")
			.notNull()
			.references(() => patients.id),
		scheduledDate: date("scheduled_date").notNull(),
		scheduledTime: time("scheduled_time").notNull(),
		durationMinutes: integer("duration_minutes").notNull().default(50),
		serviceTypeId: uuid("service_type_id")
			.notNull()
			.references(() => serviceTypes.id),
		status: sessionStatusEnum("status").notNull().default("scheduled"),
		valueBrl: numeric("value_brl", { precision: 10, scale: 2 })
			.notNull()
			.default("0"),
		paid: boolean("paid").notNull().default(false),
		paidAt: date("paid_at"),
		invoiceIssued: boolean("invoice_issued").notNull().default(false),
		assessment: text("assessment"),
		evolution: text("evolution"),
		activities: text("activities"),
		googleEventId: text("google_event_id"),
		/** Agenda Google onde o evento está (necessário p/ update/delete/mover). */
		googleCalendarId: text("google_calendar_id"),
		createdBy: uuid("created_by").references(() => users.id),
		updatedBy: uuid("updated_by").references(() => users.id),
		createdAt: timestamp("created_at", { withTimezone: true })
			.notNull()
			.defaultNow(),
		updatedAt: timestamp("updated_at", { withTimezone: true })
			.notNull()
			.defaultNow()
	},
	(t) => [
		index("sessions_clinic_date_idx").on(
			t.clinicId,
			t.scheduledDate,
			t.scheduledTime
		),
		index("sessions_patient_idx").on(t.patientId, t.scheduledDate),
		index("sessions_status_idx").on(t.clinicId, t.status),
		index("sessions_unpaid_completed_idx")
			.on(t.clinicId)
			.where(sql`${t.status} = 'completed' and ${t.paid} = false`),
		check(
			"sessions_duration_check",
			sql`${t.durationMinutes} between 5 and 480`
		),
		check("sessions_value_check", sql`${t.valueBrl} >= 0`),
		check(
			"sessions_paid_requires_date",
			sql`${t.paid} = false or ${t.paidAt} is not null`
		),
		check(
			"sessions_completed_requires_evolution",
			sql`${t.status} <> 'completed' or (${t.evolution} is not null and length(trim(${t.evolution})) > 0)`
		)
	]
);

export const sessionAudits = pgTable(
	"session_audits",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		clinicId: uuid("clinic_id")
			.notNull()
			.references(() => clinics.id, { onDelete: "cascade" }),
		sessionId: uuid("session_id")
			.notNull()
			.references(() => sessions.id, { onDelete: "cascade" }),
		editedAt: timestamp("edited_at", { withTimezone: true })
			.notNull()
			.defaultNow(),
		editedBy: uuid("edited_by").references(() => users.id),
		reason: text("reason").notNull(),
		beforeState: jsonb("before_state").notNull(),
		afterState: jsonb("after_state")
	},
	(t) => [
		index("session_audits_session_idx").on(t.sessionId, t.editedAt),
		check(
			"session_audits_reason_check",
			sql`char_length(trim(${t.reason})) > 0`
		)
	]
);

/**
 * Conexão OAuth da clínica com Google Agenda (tokens criptografados).
 */
export const googleCalendarConnections = pgTable(
	"google_calendar_connections",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		clinicId: uuid("clinic_id")
			.notNull()
			.references(() => clinics.id, { onDelete: "cascade" })
			.unique(),
		connectedByUserId: uuid("connected_by_user_id")
			.notNull()
			.references(() => users.id),
		googleAccountEmail: text("google_account_email").notNull(),
		refreshTokenEncrypted: text("refresh_token_encrypted").notNull(),
		accessTokenEncrypted: text("access_token_encrypted"),
		accessTokenExpiresAt: timestamp("access_token_expires_at", {
			withTimezone: true
		}),
		calendarId: text("calendar_id").notNull().default("primary"),
		connectedAt: timestamp("connected_at", { withTimezone: true })
			.notNull()
			.defaultNow(),
		updatedAt: timestamp("updated_at", { withTimezone: true })
			.notNull()
			.defaultNow()
	}
);

export const backupRunStatusEnum = pgEnum("backup_run_status", [
	"success",
	"error"
]);

/**
 * Conexão OAuth da clínica com Google Drive (backup automático).
 */
export const googleDriveConnections = pgTable("google_drive_connections", {
	id: uuid("id").primaryKey().defaultRandom(),
	clinicId: uuid("clinic_id")
		.notNull()
		.references(() => clinics.id, { onDelete: "cascade" })
		.unique(),
	connectedByUserId: uuid("connected_by_user_id")
		.notNull()
		.references(() => users.id),
	googleAccountEmail: text("google_account_email").notNull(),
	refreshTokenEncrypted: text("refresh_token_encrypted").notNull(),
	accessTokenEncrypted: text("access_token_encrypted"),
	accessTokenExpiresAt: timestamp("access_token_expires_at", {
		withTimezone: true
	}),
	/** Pasta no Drive onde os backups são gravados. */
	folderId: text("folder_id"),
	connectedAt: timestamp("connected_at", { withTimezone: true })
		.notNull()
		.defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true })
		.notNull()
		.defaultNow()
});

/**
 * Histórico de execuções de backup (manual ou cron).
 */
export const backupRuns = pgTable(
	"backup_runs",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		clinicId: uuid("clinic_id")
			.notNull()
			.references(() => clinics.id, { onDelete: "cascade" }),
		status: backupRunStatusEnum("status").notNull(),
		trigger: text("trigger").notNull().default("manual"),
		driveFileId: text("drive_file_id"),
		fileName: text("file_name"),
		bytes: integer("bytes"),
		errorMessage: text("error_message"),
		deletedOldFiles: integer("deleted_old_files").notNull().default(0),
		createdAt: timestamp("created_at", { withTimezone: true })
			.notNull()
			.defaultNow()
	},
	(t) => [index("backup_runs_clinic_created_idx").on(t.clinicId, t.createdAt)]
);

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
