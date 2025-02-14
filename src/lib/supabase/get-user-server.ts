import { User } from "@supabase/supabase-js";

import { supabaseServer } from "./server";

export async function getServerUser(): Promise<User | null> {
	const supabase = await supabaseServer();

	const { data, error } = await supabase.auth.getUser();
	if (error || !data?.user) return null;

	return data.user;
}
