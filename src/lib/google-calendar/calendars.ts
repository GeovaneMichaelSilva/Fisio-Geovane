/**
 * Lista agendas da conta Google conectada (CalendarList API).
 */
export type GoogleCalendarListItem = {
	id: string;
	summary: string;
	primary: boolean;
	accessRole: string;
	backgroundColor?: string;
};

export const listGoogleCalendars = async (
	accessToken: string
): Promise<GoogleCalendarListItem[]> => {
	const items: GoogleCalendarListItem[] = [];
	let pageToken: string | undefined;

	do {
		const params = new URLSearchParams({
			minAccessRole: "writer",
			maxResults: "250"
		});
		if (pageToken) params.set("pageToken", pageToken);

		const res = await fetch(
			`https://www.googleapis.com/calendar/v3/users/me/calendarList?${params}`,
			{ headers: { Authorization: `Bearer ${accessToken}` } }
		);
		const json = (await res.json()) as {
			items?: Array<{
				id?: string;
				summary?: string;
				primary?: boolean;
				accessRole?: string;
				backgroundColor?: string;
			}>;
			nextPageToken?: string;
			error?: { message?: string };
		};

		if (!res.ok) {
			throw new Error(json.error?.message || "Falha ao listar agendas Google.");
		}

		for (const item of json.items ?? []) {
			if (!item.id) continue;
			items.push({
				id: item.id,
				summary: item.summary || item.id,
				primary: Boolean(item.primary),
				accessRole: item.accessRole || "writer",
				backgroundColor: item.backgroundColor
			});
		}
		pageToken = json.nextPageToken;
	} while (pageToken);

	items.sort((a, b) => {
		if (a.primary !== b.primary) return a.primary ? -1 : 1;
		return a.summary.localeCompare(b.summary, "pt-BR");
	});

	return items;
}

/**
 * Resolve agenda alvo: tipo → padrão da conexão → primary.
 */
export const resolveTargetCalendarId = (input: {
	serviceTypeCalendarId: string | null | undefined;
	connectionDefaultCalendarId: string | null | undefined;
}): string => {
	return (
		input.serviceTypeCalendarId?.trim() ||
		input.connectionDefaultCalendarId?.trim() ||
		"primary"
	);
}
