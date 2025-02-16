import { pusher } from "./pusher";

export interface ChannelInfo {
	subscription_count: number;
}

export async function getChannelInfo(
	channel: string,
): Promise<[subscriptions: number | null]> {
	const channelReq = await pusher.get({
		path: `/channels/${channel}`,
		params: {
			info: "subscription_count",
		},
	});

	const failed = !channelReq.ok || channelReq.status !== 200;
	if (failed) {
		console.error(await channelReq.json());

		return [null];
	}

	const { subscription_count }: ChannelInfo = (await channelReq.json()) ?? {};
	const count = Number(subscription_count);
	const subscriptions = Number.isNaN(count) ? null : count;

	return [subscriptions];
}
