import { MongoClient, ObjectId, ServerApiVersion } from "mongodb";
import { z } from "zod";

import { ACTION, COLLECTION, EVENT_DATA, TEAM_LIMIT } from "#/lib/constants";
import { DB, DB_PASS, DB_USER } from "#/lib/env";

const uri = `mongodb+srv://${DB_USER}:${DB_PASS}@main.vqq3x.mongodb.net/?retryWrites=true&w=majority&appName=main`;
const client = new MongoClient(uri, {
	serverApi: {
		version: ServerApiVersion.v1,
		strict: true,
		deprecationErrors: true,
	},
});

await client.connect();
const rodillones = client.db(DB);
const events = rodillones.collection<DocEvent>(COLLECTION.EVENT);

export type Player = {
	name: string;
	registerBy: string;
};

export type Team = Player[];

export type Address = {
	text: string;
	url: string;
};

interface DocEvent {
	_id: ObjectId;
	date: string;
	address: Address;
	description: string;
	teams: Record<string, Team>;
	extraTeam: string;
}

export type Event = Omit<DocEvent, "_id" | "date"> & {
	id: string;
	date: Date;
};

const Base64Schema = z
	.string()
	.min(24, "ID must be 24 characters long.")
	.base64("The data is badly encoded.");

export async function findById(id: string): Promise<Event | null> {
	const validation = await Base64Schema.safeParseAsync(id);
	const invalidId = !validation.success;
	if (invalidId) return null;

	const docEvent = await events.findOne({
		_id: new ObjectId(validation.data),
	});
	const notFound = !docEvent;
	if (notFound) return null;

	const { _id, date, ...rest } = docEvent;
	const event = {
		id: _id.toString(),
		date: new Date(date),
		...rest,
	};

	return event;
}

export type ActionResult<T = unknown> =
	| {
			error: false;
			data?: T;
	  }
	| {
			error: true;
			msg: string;
	  };

export async function registerPlayer(
	id: string,
	{ team, player }: EVENT_DATA[ACTION.INSCRIPTION],
): Promise<ActionResult<Event>> {
	const validation = await Base64Schema.safeParseAsync(id);
	const invalidId = !validation.success;
	if (invalidId) throw new Error("Not a valid id");

	const docEvent = await events.findOne({
		_id: new ObjectId(validation.data),
	});

	const notFound = !docEvent;
	if (notFound)
		return {
			error: true,
			msg: "Este evento no existe",
		};

	const players = docEvent.teams[team] ?? [];
	const allPlayers = Object.values(docEvent.teams).flat();
	const isPlayable = docEvent.extraTeam !== team;
	const teamComplete = isPlayable && players.length >= TEAM_LIMIT;

	if (teamComplete)
		return {
			error: true,
			msg: "Al parecer el equipo ya está completo",
		};

	const alreadyRegistered = allPlayers.find(
		(p) => p.name.toLowerCase() === player.name.toLowerCase(),
	);
	if (alreadyRegistered)
		return {
			error: true,
			msg: "Este jugador ya está registrado en el evento",
		};

	const updatedDoc = await events.findOneAndUpdate(
		{ _id: new ObjectId(id) },
		{
			$push: {
				[`teams.${team}`]: player,
			},
		},
		{
			returnDocument: "after",
		},
	);

	if (!updatedDoc)
		return {
			error: true,
			msg: "El evento desapareció completamente!",
		};

	const { _id, date, ...rest } = updatedDoc;
	const event = {
		id: _id.toString(),
		date: new Date(date),
		...rest,
	};

	return {
		error: false,
		data: event,
	};
}
