"use client";

import { User } from "@supabase/supabase-js";
import { useEffect, useState } from "react";

import { supabaseClient } from "./client";

export function useUser(): User | null {
	const supabase = supabaseClient();
	const [user, setUser] = useState<User | null>(null);

	useEffect(() => {
		supabase.auth
			.getUser()
			.then(({ data }) => setUser(data.user))
			.catch((err) => {
				console.error(err.message);
				setUser(null);
			});
	}, []);

	return user;
}
