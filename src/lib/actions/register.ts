"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { ACTION, type EVENT_DATA, TEAM_LIMIT } from "../constants";
import {
	type ActionResult,
	Event,
	Player,
	registerPlayer,
} from "../event.repository";
import { pusher } from "../pusher";
import { supabaseServer } from "../supabase/server";
import { formatDate } from "../time";
import { sendMessage } from "../whatsapp.service";

const PlayerRegistrationSchema = z.object({
	team: z.string(),
	playerName: z.string().trim().min(2),
});

export type PlayerRegistration = z.infer<typeof PlayerRegistrationSchema>;

export async function registerPlayerAction(
	eventId: string,
	registration: PlayerRegistration,
): Promise<ActionResult> {
	const supabase = await supabaseServer();
	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (!user) redirect("/login");

	const validation =
		await PlayerRegistrationSchema.safeParseAsync(registration);
	const invalid = !validation.success;

	if (invalid) {
		return {
			error: true,
			msg: "El nombre del jugador debe tener al menos dos caracteres",
		};
	}

	const { playerName, team } = validation.data;

	const player: Player = {
		name: playerName,
		registerBy: user.id,
	};

	const registrationEvent = { player, team };

	let event: Event;
	try {
		const res = await registerPlayer(eventId, registrationEvent);
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

	await pusher.trigger(eventId, ACTION.INSCRIPTION, registrationEvent);

	const longDate = formatDate(event.date, { dateStyle: "full" });
	const time12 = formatDate(event.date, { timeStyle: "short", hour12: true });

	let stringTeams = "";

	for (const team in event.teams) {
		const players = Array.from(
			{ length: TEAM_LIMIT },
			(_, i) => event.teams[team][i] ?? {},
		);

		stringTeams += `\nEquipo Camisa ${team}\n`;

		stringTeams += players
			.map((player, index) => {
				const isKeeper = index === 0;
				const isLast = index === players.length - 1;

				const { name = "" } = player;

				if (isKeeper) return `\n🧤. ${name}\n`;

				const newLine = isLast ? "\n" : "";
				const num = index + 1;

				return `${num}. ${name}${newLine}`;
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
