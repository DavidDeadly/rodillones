import { MAYTAPI_API_TOKEN, MAYTAPI_PHONE_ID, MAYTAPI_PRODUCT_ID } from "./env";
import { getGroup } from "./groups.repository";

const MAYTAPI_URL = `https://api.maytapi.com/api/${MAYTAPI_PRODUCT_ID}/${MAYTAPI_PHONE_ID}`;
const MAYTAPI_HEADER = "x-maytapi-key";
const GROUP_ID = "120363382062731337@g.us";
// const GROUP_ID = "573506925825@c.us";
const headers = {
	[MAYTAPI_HEADER]: MAYTAPI_API_TOKEN,
} as Record<string, string>;

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

export async function refreshGroupsParticipants(): Promise<string[]> {
	const res = await fetch(`${MAYTAPI_URL}/getGroups/${GROUP_ID}`, {
		headers,
	});

	const fetchFailed = !res.ok;
	if (fetchFailed) throw new Error("Could get group participants");

	const data: MaytapiResponse<GroupInfo> = await res.json();

	const requestFailed = !data.success;
	if (requestFailed) throw new Error(data.message);

	const separator = "@";
	const participants = data.data.participants.map(
		(phone) => phone.split(separator).at(0)!,
	);

	return participants;
}

interface MessageSend {
	chatId: string;
	msgId: string;
}

export async function sendMessage(message: string): Promise<string> {
	const res = await fetch(`${MAYTAPI_URL}/sendMessage`, {
		method: "POST",
		headers: {
			...headers,
			"Content-Type": "application/json",
		},
		body: JSON.stringify({
			to_number: GROUP_ID,
			type: "text",
			message,
		}),
	});

	const fetchFailed = !res.ok;
	if (fetchFailed) {
		throw new Error("Could send message");
	}

	const data: MaytapiResponse<MessageSend> = await res.json();

	const requestFailed = !data.success;
	if (requestFailed) throw new Error(data.message);

	return data.data.msgId;
}
