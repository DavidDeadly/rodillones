import Pusher from "pusher";

import {
	NEXT_PUBLIC_PUSHER_CLUSTER,
	NEXT_PUBLIC_PUSHER_KEY,
	PUSHER_APP_ID,
	PUSHER_SECRET,
} from "#/lib/env";

export const pusher = new Pusher({
	appId: PUSHER_APP_ID!,
	key: NEXT_PUBLIC_PUSHER_KEY!,
	secret: PUSHER_SECRET!,
	cluster: NEXT_PUBLIC_PUSHER_CLUSTER!,
	useTLS: true,
});
