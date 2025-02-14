export function formatDate(
	date: Date,
	options: Intl.DateTimeFormatOptions,
): string {
	return new Intl.DateTimeFormat("es", options).format(date);
}
