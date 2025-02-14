"use server";

import { redirect } from "next/navigation";
import { ActionResult } from "../event.repository";
import { supabaseServer } from "../supabase/server";
import { PlayerRegistration } from "./register";

export async function cancelRegistration(
	eventId: string,
	registration: PlayerRegistration,
): Promise<ActionResult> {
	const supabase = await supabaseServer();
	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (!user) redirect("/login");

	console.log(
		`${registration.playerName} ha cancelado su registro para ${eventId}`,
	);

	if (registration.team === "Azul") {
		return {
			error: true,
			msg: "No se puede cancelar el registro de un jugador del equipo Azul",
		};
	}

	return {
		error: false,
		data: "Registro cancelado",
	};
}
