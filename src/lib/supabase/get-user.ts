import { createClient } from "./server";

export async function getServerUser(): Promise<User | null> {
	const supabase = await createClient();

	const { data, error } = await supabase.auth.getUser();
	if (error || !data?.user) return null;

	return data.user;
}
