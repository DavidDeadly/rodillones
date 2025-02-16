"use server";

import { redirect } from "next/navigation";

import { ACTION } from "../constants";
import {
	type ActionResult,
	Event,
	Player,
	registerPlayer,
} from "../event.repository";
import { pusher } from "../pusher/pusher";
import {
	PlayerRegistration,
	PlayerRegistrationSchema,
} from "../schemas/player-registration";
import { supabaseServer } from "../supabase/server";
import { getEventNotificationMessage } from "../utils";
import { sendMessage } from "../whatsapp.service";

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

	// TODO: trace events on the application and show them on a side bar

	try {
		const msg = getEventNotificationMessage(event);

		await sendMessage(msg);
	} catch (err) {
		console.error(
			"No se pudo enviar el mensaje pero la integridad del evento no fue comprometidad",
		);
	}

	return {
		error: false,
	};
}
