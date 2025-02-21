'use client'

import { useEffect, useReducer } from "react";

import { ACTION, EVENT_DATA } from "#/lib/constants";
import { pusherClient } from "#/lib/pusher/pusher-client";
import { registerPlayerAction } from "#/lib/actions/register";
import { cancelRegistration } from "#/lib/actions/cancel";
import { Event } from '#/lib/event.repository';

import { TeamCard } from "./team-card";

type Action =
|{
  type: ACTION.INSCRIPTION,
} & EVENT_DATA[ACTION.INSCRIPTION]
| {
  type: ACTION.REMOVAL,
} & EVENT_DATA[ACTION.REMOVAL]

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

    case ACTION.REMOVAL: {
      const team = state[action.team];
      const abandonedTeam = team.filter(player => player.name !== action.player.name);

      return {
        ...state,
        [action.team]: abandonedTeam
      }
    }
  }
}

interface EventManagementProps {
  channel: string;
  event: Event;
  userId: string;
}

export function EventManagement({ channel, event, userId }: EventManagementProps) {
  const [state, dispatch] = useReducer(reducer, event.teams);

  const register = registerPlayerAction.bind(null, channel);
  const remove = cancelRegistration.bind(null, channel);

  useEffect(() => {
    const channelSubscription = pusherClient.subscribe(channel);

    const incription = ACTION.INSCRIPTION;
    channelSubscription.bind(incription, (event: EVENT_DATA[typeof incription]) => {
      dispatch({ type: incription, ...event });
    });

    const cancelation = ACTION.REMOVAL;
    channelSubscription.bind(cancelation, (event: EVENT_DATA[typeof cancelation]) => {
      dispatch({ type: cancelation, ...event });
    });

    return () => {
      channelSubscription.unbind_all();
      channelSubscription.unsubscribe();
    }
  }, []);

  return (
    <div className="w-full flex flex-col gap-5 items-center">
      <div className="w-4/5 md:w-full flex flex-wrap justify-center gap-4 mb-6">
        {
          Object.entries(state).map(([name, team]) => 
            <TeamCard
              key={name}
              team={name}
              players={team}
              registerAction={register}
              removeAction={remove}
              userId={userId}
              isExtra={name === event.extraTeam}
            />
          )
        }
      </div>
    </div>
  )
}

