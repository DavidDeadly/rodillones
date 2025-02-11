export const enum ACTION {
	INSCRIPTION = "inscription",
	REMOVAL = "removal",
}

export type EVENT_DATA = {
	[ACTION.INSCRIPTION]: {
		player: string;
		team: string;
	};
	[ACTION.REMOVAL]: {
		player: string;
		team: string;
		reason: string;
	};
};

export const enum ENDPOINT {
	SEND_MESSAGE = "/api/send",
}

export const enum COLLECTION {
	EVENT = "Events",
}

export const TEAM_LIMIT = 7;
