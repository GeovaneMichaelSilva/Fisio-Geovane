/**
 * Valores padrão da clínica e dos tipos de atendimento (seed / bootstrap).
 */

export const DEFAULT_CLINIC = {
	displayName: "Geovane Michael da Silva",
	professionLabel: "Fisioterapeuta",
	licenseNumber: "549225-F",
	timezone: "America/Sao_Paulo",
	defaultSessionDurationMinutes: 50
} as const;

export const DEFAULT_SERVICE_TYPES = [
	{
		name: "Vestibular",
		slug: "vestibular",
		defaultDurationMinutes: 50,
		defaultValueBrl: "220.00",
		sortOrder: 1
	},
	{
		name: "Ortopédico",
		slug: "ortopedico",
		defaultDurationMinutes: 50,
		defaultValueBrl: "220.00",
		sortOrder: 2
	},
	{
		name: "Domiciliar",
		slug: "domiciliar",
		defaultDurationMinutes: 50,
		defaultValueBrl: "280.00",
		sortOrder: 3
	}
] as const;
