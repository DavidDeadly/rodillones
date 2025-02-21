'use client';

import clsx from "clsx";

import { Player } from "#/lib/db/client";
import { ActionResult } from "#/lib/event.repository";
import { PlayerRegistration } from "#/lib/schemas/player-registration";
import { CancelDialog } from "./cancel";

interface PlayerCardProps {
  team: string,
  player: Player,
  userId: string
  isPlayableTeam: boolean,
  action: (registration: Omit<PlayerRegistration, 'isKeeper'>) => Promise<ActionResult>
};

export function PlayerCard({ team, player, userId, isPlayableTeam, action }: PlayerCardProps) {
  const registerByMe = player.registerBy === userId;

  return (
    <article className={clsx(
      "flex items-center justify-around rounded h-10 pl-2 pr-1",
      {
        "bg-secondary": !player.isKeeper,
        "bg-yellow-600": player.isKeeper
      }
    )}>

      <span className="inline-block flex-1">
        {
          player.isKeeper ? `🧤 ${player.name}` : player.name
        }
      </span>

      {registerByMe && <CancelDialog team={team} playerName={player.name} isPlayableTeam={isPlayableTeam} action={action} />}
    </article>
  )
}

