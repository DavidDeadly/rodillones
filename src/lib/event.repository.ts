import { MongoClient, ObjectId, ServerApiVersion } from "mongodb";
import * as v from "valibot";
import { ACTION, COLLECTION, EVENTS, TEAM_LIMIT } from "#/lib/constants";
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
const EVENTS = rodillones.collection<DocEvent>(COLLECTION.EVENT);

type Team = string[];

interface DocEvent {
	_id: ObjectId;
	date: string;
	address: string;
	description: string;
	teams: Record<string, Team>;
}

export type Event = Omit<DocEvent, "_id" | "date"> & {
	id: string;
	date: Date;
};

const Base64Schema = v.pipe(
	v.string(),
	v.minLength(24, "ID must be 24 characters long."),
	v.base64("The data is badly encoded."),
);

export async function findById(id: string): Promise<Event | null> {
	const validation = await v.safeParseAsync(Base64Schema, id);
	const invalidId = !validation.success;
	if (invalidId) return null;

	const docEvent = await EVENTS.findOne({
		_id: new ObjectId(validation.output),
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

export type RegisterResult =
	| {
			error: false;
	  }
	| {
			error: true;
			msg: string;
	  };

export async function registerPlayer(
	id: string,
	{ team, player }: EVENTS[ACTION.INSCRIPTION],
): Promise<RegisterResult> {
	const validation = await v.safeParseAsync(Base64Schema, id);
	const invalidId = !validation.success;
	if (invalidId) throw new Error("Not a valid id");

	const docEvent = await EVENTS.findOne({
		_id: new ObjectId(validation.output),
	});

	const notFound = !docEvent;
	if (notFound)
		return {
			error: true,
			msg: "Este evento no existe",
		};

	const players = docEvent.teams[team] ?? [];
	const allPlayers = Object.values(docEvent.teams).flat();

	if (players.length >= TEAM_LIMIT)
		return {
			error: true,
			msg: "Al parecer el equipo ya está completo",
		};

	if (allPlayers.includes(player))
		return {
			error: true,
			msg: "Este jugador ya está registrado en el evento",
		};

	await EVENTS.updateOne(
		{ _id: new ObjectId(id) },
		{
			$push: {
				[`teams.${team}`]: player,
			},
		},
	);

	return {
		error: false,
	};
}
