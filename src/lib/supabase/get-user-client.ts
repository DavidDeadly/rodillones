"use client";

import { User } from "@supabase/supabase-js";
import { useEffect, useState } from "react";

import { supabaseClient } from "./client";

export function useUser(): User | null {
	const supabase = supabaseClient();
	const [user, setUser] = useState<User | null>(null);

	useEffect(() => {
		supabase.auth
			.getSession()
			.then((session) => setUser(session.data.session?.user ?? null))
			.catch((err) => {
				console.error(err.message);
				setUser(null);
			});
	}, []);

	return user;
}
