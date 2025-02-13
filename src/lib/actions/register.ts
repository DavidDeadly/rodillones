"use server";

import { z } from "zod";
import { ACTION, type EVENT_DATA, TEAM_LIMIT } from "../constants";
import { type ActionResult, Event, registerPlayer } from "../event.repository";
import { pusher } from "../pusher";
import { sendMessage } from "../whatsapp.service";

const RegisterPlayerSchema = z.object({
	team: z.string(),
	player: z.string().trim().min(2),
});

export async function registerPlayerAction(
	eventId: string,
	registration: EVENT_DATA[ACTION.INSCRIPTION],
): Promise<ActionResult> {
	const data = await RegisterPlayerSchema.safeParseAsync(registration);
	const invalid = !data.success;

	if (invalid) {
		return {
			error: true,
			msg: "El nombre del jugador debe tener al menos dos caracteres",
		};
	}

	let event: Event;
	try {
		const res = await registerPlayer(eventId, registration);
		if (res.error) return res;

		event = res.data!;
	} catch (err) {
		const error = err as Error;
		console.error(error.message);

		return {
			error: true,
			msg: "Hubo un error en tu registro",
		};
	}

	await pusher.trigger(eventId, ACTION.INSCRIPTION, data.data);

	const longDate = new Intl.DateTimeFormat("es", { dateStyle: "full" }).format(
		event.date,
	);
	const time12 = new Intl.DateTimeFormat("es", {
		timeStyle: "short",
		hour12: true,
	}).format(event.date);

	let stringTeams = "";

	for (const team in event.teams) {
		const players = Array.from(
			{ length: TEAM_LIMIT },
			(_, i) => event.teams[team][i] ?? "",
		);

		stringTeams += `\nEquipo Camisa ${team}\n`;

		stringTeams += players
			.map((player, index) => {
				const isKeeper = index === 0;
				const isLast = index === players.length - 1;

				if (isKeeper) return `\n🧤. ${player}\n`;

				const newLine = isLast ? "\n" : "";
				const num = index + 1;
				return `${num}. ${player}${newLine}`;
			})
			.join("\n");
	}

	const msg = `
${longDate}
${time12}
${event.description}
Dirección: ${event.address} 

https://maps.app.goo.gl/ikk2aHTpGzpk16UH9
${stringTeams}

Reserva
1. Daniel Puerta
2. Daniel Agudelo
3. Julián Pérez
4. Jeison parra
5. Oscar Molina
`;
	// TODO: add extra users to the event
	// TODO: allow player removal and take from the extra to fill the empty
	// TODO: trace events on the application and show them on a side bar

	await sendMessage(msg);

	return {
		error: false,
	};
}
