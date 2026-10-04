export type {
	GoogleCalendarStatus as GoogleStatus,
	GoogleCalendarOption as GoogleCalendar,
	GoogleDriveStatus as DriveStatus
} from "@/queries/googleIntegrationsQuery";

export type IntegrationServiceType = {
	id: string;
	name: string;
	isActive: boolean;
	googleCalendarId: string | null;
};
