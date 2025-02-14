import { redirect } from "next/navigation";

import { getServerUser } from "#/lib/supabase/get-user-server";

export default async function Home() {
  const user = await getServerUser();

  const path = user ? "event/67a91921d729657addde107a" : "/login";

  redirect(path);
}
