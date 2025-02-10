import Pusher from "pusher";
import {
	NEXT_PUBLIC_PUSHER_APP_ID,
	NEXT_PUBLIC_PUSHER_CLUSTER,
	PUSHER_KEY,
	PUSHER_SECRET,
} from "./env";

export const pusher = new Pusher({
	appId: NEXT_PUBLIC_PUSHER_APP_ID!,
	key: PUSHER_KEY!,
	secret: PUSHER_SECRET!,
	cluster: NEXT_PUBLIC_PUSHER_CLUSTER!,
	useTLS: true,
});
