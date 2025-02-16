import { MongoClient, ObjectId, ServerApiVersion } from "mongodb";

import { DB, DB_PASS, DB_USER } from "#/lib/env";

import { COLLECTION } from "../constants";

const uri = `mongodb+srv://${DB_USER}:${DB_PASS}@main.vqq3x.mongodb.net/?retryWrites=true&w=majority&appName=main`;

const client = new MongoClient(uri, {
	serverApi: {
		version: ServerApiVersion.v1,
		strict: true,
		deprecationErrors: true,
	},
});

const rodillones = client.db(DB);

export type Player = {
	name: string;
	registerBy: string;
	isKeeper?: boolean;
};

export type Team = Player[];

export type Address = {
	text: string;
	url: string;
};

export interface DocEvent {
	_id: ObjectId;
	date: string;
	address: Address;
	description: string;
	teams: Record<string, Team>;
	extraTeam: string;
}

export const events = rodillones.collection<DocEvent>(COLLECTION.EVENTS);

export interface Participant {
	id: string;
	rank: "member" | "creator";
}

export interface GroupChahe {
	_id: ObjectId;
	groupId: string;
	participants: Participant[];
}

export const whatsappGroups = rodillones.collection<GroupChahe>(
	COLLECTION.WHATSAPP_GROUPS,
);
