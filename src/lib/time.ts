export function formatDate(
	date: Date,
	options: Intl.DateTimeFormatOptions,
): string {
	return new Intl.DateTimeFormat("es", {
		timeZone: "America/Bogota",
		...options,
	}).format(date);
}
