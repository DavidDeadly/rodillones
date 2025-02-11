"use server";

import * as v from "valibot";
import { RegisterResult } from "#/components/event-management";
import { ACTION, EVENTS } from "./constants";
import { pusher } from "./pusher";

const RegisterPlayer = v.object({
	player: v.pipe(v.string(), v.trim(), v.minLength(2)),
	team: v.string(),
});

export async function registerPlayerAction(
	eventId: string,
	registration: EVENTS[ACTION.INSCRIPTION],
): Promise<RegisterResult> {
	const data = await v.safeParseAsync(RegisterPlayer, registration);
	const invalid = !data.success;

	if (invalid) {
		return {
			error: true,
			msg: "El nombre del jugador debe tener al menos dos caracteres",
		};
	}

	await pusher.trigger(eventId, ACTION.INSCRIPTION, data.output);

	return {
		error: false,
	};
}
