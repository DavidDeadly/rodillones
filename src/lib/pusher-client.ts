import PusherClient from "pusher-js";

PusherClient.logToConsole = true;

export const pusherClient = new PusherClient(
	process.env.NEXT_PUBLIC_PUSHER_KEY!,
	{
		cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
	},
);
