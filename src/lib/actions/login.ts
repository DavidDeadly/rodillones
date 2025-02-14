"use server";

import { redirect } from "next/navigation";
import { z } from "zod";

import { ActionResult } from "../event.repository";
import { supabaseServer } from "../supabase/server";
import { getGroupParticipants } from "../whatsapp.service";

export async function loginPasslessPhone(
	prev: ActionResult<string>,
	formData: FormData,
): Promise<ActionResult<string>> {
	const otp = formData.get("otp")?.toString() ?? "";

	const shouldVerify = otp && !prev.error && prev.data;
	if (shouldVerify) {
		const phone = prev.data ?? "";
		return verifyOtp(phone, otp);
	}

	const phoneNumber = formData.get("phone")?.toString() ?? "";

	return requestOtp(phoneNumber);
}

const PhoneSchema = z.coerce
	.string()
	.nonempty("Por favor, ingresa tú número de celular")
	.length(10, "El número de celular deber ser de 10 dígitos");

const sanitizePhoneNumber = (phoneNumber: string) => {
	return phoneNumber.replace(/[^0-9+]/g, "");
};

async function requestOtp(number: string): Promise<ActionResult<string>> {
	const sanitizedNumber = sanitizePhoneNumber(number);
	const validation = await PhoneSchema.safeParseAsync(sanitizedNumber);

	const invalid = !validation.success;
	if (invalid) {
		const msg =
			validation.error.errors.at(0)?.message ?? "Número de celular no válido";

		return {
			error: true,
			msg,
		};
	}

	const phone = `57${validation.data}`;

	const participationError = await validateParticipant(phone);
	if (participationError) return participationError;

	const supabase = await supabaseServer();
	const { error } = await supabase.auth.signInWithOtp({ phone });

	if (error) redirect("/error");

	return {
		error: false,
		data: phone,
	};
}

async function verifyOtp(
	phone: string,
	token: string,
): Promise<ActionResult<string>> {
	const supabase = await supabaseServer();

	const {
		data: { session },
		error,
	} = await supabase.auth.verifyOtp({
		phone,
		token,
		type: "sms",
	});

	const noSession = !session?.access_token;
	if (error || noSession)
		return {
			error: false,
			data: phone,
		};

	redirect("/event/67a91921d729657addde107a");
}

async function validateParticipant(
	phone: string,
): Promise<ActionResult<string> | null> {
	try {
		const participants = await getGroupParticipants();

		const isParticipant = participants.includes(phone);

		if (isParticipant) return null;
	} catch (err) {
		const error = err as Error;
		console.error(`Participation Error: ${error.message}`);

		return {
			error: true,
			msg: "Hubo un error validando su pertenencia al grupo",
		};
	}

	return {
		error: true,
		msg: "No haces parte del grupo RODILLONES",
	};
}
