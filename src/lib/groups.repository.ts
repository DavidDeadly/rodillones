import { GroupChahe, whatsappGroups } from "./db/client";

export interface WhatsAppGroup extends Omit<GroupChahe, "_id"> {
	id: string;
}

export async function getGroup(groupId: string): Promise<WhatsAppGroup | null> {
	const group = await whatsappGroups.findOne({ groupId });

	const notFound = !group;
	if (notFound) return null;

	const { _id, ...data } = group;

	return {
		id: _id.toString(),
		...data,
	};
}
