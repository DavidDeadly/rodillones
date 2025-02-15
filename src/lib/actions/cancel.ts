"use server";

import { redirect } from "next/navigation";

import { ACTION } from "../constants";
import {
	ActionResult,
	Event,
	Player,
	unregisterPlayer,
} from "../event.repository";
import { pusher } from "../pusher";
import {
	PlayerRegistration,
	PlayerRegistrationSchema,
} from "../schemas/player-registration";
import { supabaseServer } from "../supabase/server";
import { getEventNotificationMessage } from "../utils";
import { sendMessage } from "../whatsapp.service";

export async function cancelRegistration(
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
			msg: "No se ha podido pocesar la cancelación",
		};
	}

	const { playerName, team } = validation.data;

	const player: Player = {
		name: playerName,
		registerBy: user.id,
	};

	const cancelationEvent = { player, team };

	let event: Event;
	try {
		const res = await unregisterPlayer(eventId, cancelationEvent);
		if (res.error) return res;

		event = res.data!;
	} catch (err) {
		const error = err as Error;
		console.error(error.message);

		return {
			error: true,
			msg: "Ha ocurrido un error al cancelar el registro",
		};
	}

	await pusher.trigger(eventId, ACTION.REMOVAL, cancelationEvent);

	const msg = getEventNotificationMessage(event);
	await sendMessage(msg);

	return {
		error: false,
		data: "Registro cancelado",
	};
}
