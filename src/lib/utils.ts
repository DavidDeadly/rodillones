import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

import type { Event } from "#/lib/event.repository";
import { TEAM_LIMIT } from "./constants";

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

export function formatDate(
	date: Date,
	options: Intl.DateTimeFormatOptions,
): string {
	return new Intl.DateTimeFormat("es", {
		timeZone: "America/Bogota",
		...options,
	}).format(date);
}

interface GetPluralOption {
	num: number;
	one: string;
	other: string;
}

export function getPlural(options: GetPluralOption) {
	const { num } = options;
	const selection = new Intl.PluralRules("es").select(num);

	// @ts-expect-error next-line
	return options[selection] as string;
}

export function getEventNotificationMessage(event: Event): string {
	const longDate = formatDate(event.date, { dateStyle: "full" });
	const time12 = formatDate(event.date, { timeStyle: "short", hour12: true });

	let stringTeams = "";

	for (const team in event.teams) {
		const isPlayable = event.extraTeam !== team;
		const registeredPlayers = event.teams[team];

		const keeper = isPlayable
			? registeredPlayers.find((player) => player.isKeeper)
			: null;
		const fieldPlayers = isPlayable
			? registeredPlayers.filter((player) => !player.isKeeper)
			: registeredPlayers;

		const fieldPlayersSize = TEAM_LIMIT - 1;
		const length = isPlayable ? fieldPlayersSize : event.teams[team].length;
		const players = Array.from({ length }, (_, i) => fieldPlayers[i] ?? {});

		const teamPrefix = isPlayable ? "Equipo Camisa " : "";
		stringTeams += `\n${teamPrefix}${team}\n`;

		if (isPlayable) {
			const { name = "" } = keeper ?? {};

			stringTeams += `\n🧤. ${name}\n\n`;
		}

		stringTeams += players
			.map((player, index) => {
				const { name = "" } = player;

				const ignoreKeeper = 1;
				const oneIndex = 1;
				const numIncrease = isPlayable ? oneIndex + ignoreKeeper : oneIndex;
				const num = index + numIncrease;
				const isLast = index === players.length - 1;
				const newLine = isLast ? "\n" : "";

				return `${num}. ${name}${newLine}`;
			})
			.join("\n");
	}

	const msg = `
${longDate}
${time12}
${event.description}
Dirección: ${event.address.text} 

${event.address.url}
${stringTeams}
`;

	return msg;
}
