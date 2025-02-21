'use client';

import clsx from 'clsx';

import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "./ui/card";
import { TEAM_LIMIT } from '#/lib/constants';
import { Event, ActionResult } from '#/lib/event.repository';
import { PlayerRegistration } from '#/lib/schemas/player-registration';
import { PlayerCard } from './player-card';
import { Alert, AlertTitle } from './ui/alert';
import { RegisterDialog } from './register-dialog';

export interface TeamCardProps {
  team: string,
  players: Event['teams'][string],
  isExtra: boolean,
  userId: string,
  registerAction: (registration: PlayerRegistration) => Promise<ActionResult>
  removeAction: (registration: Omit<PlayerRegistration, 'isKeeper'>) => Promise<ActionResult>
}

export function TeamCard({ team, players, registerAction, removeAction, isExtra, userId }: TeamCardProps) {
  const isPlayableTeam = !isExtra;
  const teamFull = isPlayableTeam && players.length >= TEAM_LIMIT;

  const keeper = isPlayableTeam ? players.find((player) => player.isKeeper) : null;
  const fieldPlayers = isPlayableTeam ? players.filter((player) => !player.isKeeper) : players;
  const showKeeperAlert = isPlayableTeam && !keeper && Boolean(players.length);

  return (
    <Card className={clsx(
      "grid w-72 grid-rows-[auto_1fr_auto]",
      {
        "border-primary border-2": isPlayableTeam,
        "border-green-600 border-2": teamFull
      }
    )}>
      <CardHeader>
        <CardTitle className="text-2xl font-semibold text-center">{team}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-2">
          {
            keeper && <PlayerCard
              key={keeper.name}
              team={team}
              player={keeper}
              userId={userId}
              isPlayableTeam={isPlayableTeam}
              action={removeAction}
            />
          }

          {
            showKeeperAlert && 
              <Alert className={clsx("bg-yellow-600", { "animate-pulse": isPlayableTeam })}>
                <AlertTitle>
                  <strong>¡Necesitamos GATO!</strong>
                </AlertTitle>
              </Alert>
          }

          {
            fieldPlayers.length === 0 &&
              <Alert className={clsx({ "animate-pulse": isPlayableTeam })}>
                <AlertTitle>
                  <strong>¡Esperando jugadores!</strong>
                </AlertTitle>
              </Alert>
          }

          {fieldPlayers.map((player) =>
            <PlayerCard
              key={player.name}
              team={team}
              player={player}
              userId={userId}
              isPlayableTeam={isPlayableTeam}
              action={removeAction}
            />
          )}
        </div>
      </CardContent>

      <CardFooter>
        <RegisterDialog team={team} players={players} isPlayableTeam={isPlayableTeam} action={registerAction}/>
      </CardFooter>
    </Card>
  )
}
