"use server";

import { redirect } from "next/navigation";
import { ActionResult } from "../event.repository";
import { createClient } from "../supabase/server";

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

async function requestOtp(phoneNumber: string): Promise<ActionResult<string>> {
	// TODO: change valibot for zod or similar to validate phone number;
	const phone = `57${phoneNumber}`;

	const supabase = await createClient();
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
	const supabase = await createClient();

	const {
		data: { session },
		error,
	} = await supabase.auth.verifyOtp({
		phone,
		token,
		type: "sms",
	});

	const noSession = !session?.access_token;
	if (error || noSession) {
		console.error({ err: error?.message, noSession });

		return redirect("/error");
	}

	redirect("/event/67a91921d729657addde107a");
}
