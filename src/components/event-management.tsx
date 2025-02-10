'use client'
import { DocEvent } from "#/app/event/[id]/page";
import { ACTION, ENDPOINT } from "#/lib/constants";
import { pusherClient } from "#/lib/pusher-client";
import clsx from "clsx";
import { useEffect, useReducer } from "react";

export type Event = Omit<DocEvent, '_id' | 'date'> & {
  id: string;
  date: Date;
}

interface EventManagementProps {
  event: Event;
}

type EVENTS = {
  [ACTION.INSCRIPTION]: {
    player: string;
    team: string;
  },
  [ACTION.REMOVAL]: {
    player: string;
    team: string;
    reason: string;
  }
}

type Action =
|{
  type: ACTION.INSCRIPTION,
} & EVENTS[ACTION.INSCRIPTION]
| {
  type: ACTION.REMOVAL,
} & EVENTS[ACTION.REMOVAL]


function reducer(state: Event['teams'], action: Action): Event['teams'] {
  switch (action.type) {
    case ACTION.INSCRIPTION: {
      const team = state[action.team];

      return {
        ...state,
        [action.team]: [
          ...team,
          action.player
        ]
      }
    }
  }

  throw Error('Unknown action: ' + action.type);
}

export function EventManagement({ event }: EventManagementProps) {
  const channel = event.id;
   const [state, dispatch] = useReducer(reducer, event.teams);

  useEffect(() => {
    pusherClient.subscribe(channel);

    const action = ACTION.INSCRIPTION;
    pusherClient.bind(action, (event: EVENTS[typeof action]) => {
      dispatch({ type: action, ...event });
    });

    return () =>
      pusherClient.unsubscribe(channel);
  }, []);

  const sendMessage = async () => {
    const body: EVENTS[ACTION.INSCRIPTION] = {
      player: "John Doe",
      team: "Amarillo"
    };

    const res = await fetch(`${ENDPOINT.SEND_MESSAGE}/${channel}`, {
      method: "POST",
      body: JSON.stringify(body)
    });

    const failed = !res.ok;
    if (failed) {
      console.error(`Send messgae failed with status: ${res.status}`)
      return;
    }

    const data = await res.json();
    console.log(data);
  }

  return (
    <div className="w-full my-4 flex flex-col gap-5 items-center">
      <button onClick={sendMessage}>Send</button>

      <div className="w-52 border-[#9cd4bd] border-2 rounded p-4 text-center">
        <h1 className="text-xl font-bold">
          { event.address }
        </h1>

        <p>{event.description}</p>

        <p>{event.date.toLocaleDateString()} - {event.date.toLocaleTimeString()}</p>
      </div>

      {
        Object.entries(state).map(([name, team]) => (
          <div key={name} className="w-4/5 bg-[#3E3E4D] rounded-lg p-5">
            <h1 className="text-2xl font-bold text-center mb-2">{name}</h1>

            <div className="grid grid-cols-2 gap-2">

                {
                  team.map((player, index) => {
                    const isKeeper = index === 0;

                    return (
                      <div key={index} className={clsx(isKeeper && "col-span-2", "bg-[#2A2A3A] rounded py-1 px-2")}>
                        <p className="text-center">{player}</p>
                      </div>

                    );
                  })
                }
              </div>
            </div>
          ))
      }

    </div>
  )
}
