"use server";

import { redirect } from "next/navigation";

import { ACTION } from "../constants";
import { Player } from "../db/client";
import { ActionResult, Event, unregisterPlayer } from "../event.repository";
import { pusher } from "../pusher/pusher";
import {
	PlayerRegistration,
	PlayerRegistrationSchema,
} from "../schemas/player-registration";
import { supabaseServer } from "../supabase/server";
import { getEventNotificationMessage } from "../utils";
import { sendMessage } from "../whatsapp.service";

export async function cancelRegistration(
	eventId: string,
	registration: Omit<PlayerRegistration, "isKeeper">,
): Promise<ActionResult> {
	const supabase = await supabaseServer();
	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (!user) return redirect("/login");

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

	const player: Omit<Player, "isKeeper"> = {
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

	try {
		const msg = getEventNotificationMessage(event);

		await sendMessage(msg);
	} catch {
		console.error(
			"No se pudo enviar el mensaje pero la integridad del evento no fue comprometidad",
		);
	}

	return {
		error: false,
		data: "Registro cancelado",
	};
}
