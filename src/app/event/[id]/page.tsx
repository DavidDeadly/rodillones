import { MongoClient, ObjectId, ServerApiVersion } from 'mongodb';
import { EventManagement, type Event } from '#/components/event-management';

import * as v from 'valibot';
import { DB, DB_PASS, DB_USER } from '#/lib/env';
import { COLLECTION } from '#/lib/constants';

const uri = `mongodb+srv://${DB_USER}:${DB_PASS}@main.vqq3x.mongodb.net/?retryWrites=true&w=majority&appName=main`
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

await client.connect();

const rodillones = client.db(DB);

export type Team = string[];

export interface DocEvent {
  _id: ObjectId;
  date: string;
  address: string;
  description: string;
  teams: Record<string, Team>;
}

const EVENTS = rodillones.collection<DocEvent>(COLLECTION.EVENT);

interface EventProps {
  params: Promise<{ id: unknown }>
}

const Base64Schema = v.pipe(
  v.string(),
  v.minLength(24, 'ID must be 24 characters long.'),
  v.base64('The data is badly encoded.')
);


export default async function Event({ params }: EventProps) {
  const { id } = await params;

  const validation = await v.safeParseAsync(Base64Schema, id);
  const invalidId = !validation.success;
  if (invalidId)
    return <h1>That&apos;s not a valid event ID</h1>

  const docEvent = await EVENTS.findOne({ _id: new ObjectId(validation.output) });
  const notFound = !docEvent;
  if (notFound) return <h1>Event does not exist sorry</h1>;

  const { _id, date, ...rest } = docEvent;
  const event = {
    id: _id.toString(),
    date: new Date(date),
    ...rest
  }

  return <EventManagement event={event}/>
}
