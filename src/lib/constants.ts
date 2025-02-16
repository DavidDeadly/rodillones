import { Player } from "./db/client";

export const enum ACTION {
	INSCRIPTION = "inscription",
	REMOVAL = "removal",
}

export type EVENT_DATA = {
	[ACTION.INSCRIPTION]: {
		team: string;
		player: Player;
	};
	[ACTION.REMOVAL]: {
		player: Omit<Player, "isKeeper">;
		team: string;
	};
};

export const enum ENDPOINT {
	SEND_MESSAGE = "/api/send",
}

export const enum COLLECTION {
	EVENTS = "Events",
	WHATSAPP_GROUPS = "WhatsAppGroups",
}

export const TEAM_LIMIT = 7;
