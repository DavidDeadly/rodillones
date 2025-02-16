import { WHAPI_TOKEN, ZAPLY_INSTANCE, ZAPLY_TOKEN } from "./env";
import { getGroup } from "./groups.repository";

const GROUP_ID =
	process.env.NODE_ENV === "production"
		? "120363382062731337@g.us"
		: "573506925825@s.whatsapp.net";

interface SendMessage {
	(message: string): Promise<[messageId: string]>;
}

export const sendMessage: SendMessage =
	process.env.NODE_ENV === "production" ? sendMessageWhapi : sendMessageZaply;

export type MaytapiResponse<T> =
	| {
			success: true;
			data: T;
	  }
	| {
			success: false;
			message: string;
	  };

export interface GroupInfo {
	id: string;
	name: string;
	participants: string[];
	admins: string[];
	config: Config;
}

export interface Config {
	edit: string;
	send: string;
	disappear: boolean;
	membersCanAddMembers: boolean;
	approveNewMembers: boolean;
}

export async function getGroupParticipants(): Promise<string[]> {
	const group = await getGroup(GROUP_ID);

	const notFound = !group;
	if (notFound) throw new Error("Could get group participants");

	const participants = group.participants.map((user) => user.id);

	return participants;
}

interface Message {
	id: string;
	type: string;
	from: string;
	from_me: boolean;
	chat_id: string;
	timestamp: number;
	source: string;
	device_id: 3;
	status: "pending" | "delivered";
	text: {
		body: string;
	};
}

interface MessageSend {
	sent: true;
	message: Message;
}

async function sendMessageWhapi(message: string): Promise<[messageId: string]> {
	console.log("[WHAPI]: Sending Message");

	const res = await fetch("https://gate.whapi.cloud/messages/text", {
		method: "POST",
		headers: {
			Authorization: `Bearer ${WHAPI_TOKEN}`,
			"Content-Type": "application/json",
		},
		body: JSON.stringify({
			to: GROUP_ID,
			body: message,
		}),
	});

	const fetchFailed = !res.ok;
	if (fetchFailed) throw new Error("[WHAPI]: Could send message");

	const data: MessageSend = await res.json();

	const requestFailed = !data.sent;
	if (requestFailed) throw new Error("[WHAPI]: Message not sent");

	return [data.message.id];
}

async function sendMessageZaply(message: string): Promise<[messageId: string]> {
	console.log("[ZAPLY]: Sending Message");

	const number = GROUP_ID.split("@").at(0);
	const res = await fetch(
		`https://api.zaply.dev/v1/instance/${ZAPLY_INSTANCE}/message/send`,
		{
			method: "POST",
			headers: {
				Authorization: `Bearer ${ZAPLY_TOKEN}`,
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				number,
				message,
			}),
		},
	);

	const fetchFailed = !res.ok;
	if (fetchFailed) throw new Error("[ZAPLY]: Could send message");

	const data: { message_id?: string } = await res.json();

	if (!data.message_id) throw new Error("[ZAPLY]: Message not sent");

	return [data.message_id];
}
