import PusherClient from "pusher-js";

export const pusherClient = new PusherClient(
	process.env.NEXT_PUBLIC_PUSHER_APP_ID!,
	{
		cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
	},
);
