'use client'

import clsx from "clsx";
import { useCallback, useEffect, useReducer, useState } from "react";
import { useFormStatus } from "react-dom";
import { CircleCheckBig, CircleX, Delete, Loader, LogOut, UserCheck, UserPlus, X } from "lucide-react";
import { toast } from "sonner";

import { ACTION, EVENT_DATA, TEAM_LIMIT } from "#/lib/constants";
import { pusherClient } from "#/lib/pusher-client";
import { PlayerRegistration, registerPlayerAction } from "#/lib/actions/register";
import { Event, ActionResult, Player } from '#/lib/event.repository';

import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "./ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";
import { Button } from "./ui/button";
import { Label } from "./ui/label";
import { Input } from "./ui/input";
import { cancelRegistration } from "#/lib/actions/cancel";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "./ui/alert-dialog";

interface EventManagementProps {
  event: Event;
  userId: string;
}

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
  }

  throw Error('Unknown action: ' + action.type);
}

interface PlayerCardProps {
  team: string,
  player: Player,
  isKeeper: boolean,
  userId: string
  action: (registration: PlayerRegistration) => Promise<ActionResult>
};

function PlayerCard({ team, player, userId, action }: PlayerCardProps) {
  const registerByMe = player.registerBy === userId;

  return (
    <article className="flex items-center justify-around rounded bg-secondary h-10 pl-2">
      <span className="inline-block flex-1">{player.name}</span>

      {registerByMe && <CancelDialog team={team} playerName={player.name} action={action} />}
    </article>
  )
}

export interface TeamCardProps {
  team: string,
  players: Event['teams'][string],
  isExtra: boolean,
  userId: string,
  register: (registration: PlayerRegistration) => Promise<ActionResult>
  remove: (registration: PlayerRegistration) => Promise<ActionResult>
}

function TeamCard({ team, players, register, remove, isExtra, userId }: TeamCardProps) {
  const isPlayableTeam = !isExtra;

  return (
    <Card className={clsx(
      "grid w-72 grid-rows-[auto_1fr_auto]",
      {
        "border-primary border-2": isPlayableTeam,
        "border-green-600 border-2": players.length === TEAM_LIMIT
      }
    )}>
      <CardHeader>
        <CardTitle className="text-2xl font-semibold text-center">{team}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-2">
          {players.map((player, index) =>
            <PlayerCard
              key={player.name}
              team={team}
              player={player}
              userId={userId}
              isKeeper={index === 0}
              action={remove}
            />
          )}
        </div>
      </CardContent>

      <CardFooter>
        <RegisterDialog team={team} players={players} isPlayableTeam={isPlayableTeam} action={register}/>
      </CardFooter>
    </Card>
  )
}

export function EventManagement({ event, userId }: EventManagementProps) {
  const channel = event.id;
  const [state, dispatch] = useReducer(reducer, event.teams);

  const register = registerPlayerAction.bind(null, channel);
  const remove = cancelRegistration.bind(null, channel);

  useEffect(() => {
    const channelSubscription = pusherClient.subscribe(channel);

    const action = ACTION.INSCRIPTION;
    channelSubscription.bind(action, (event: EVENT_DATA[typeof action]) => {
      dispatch({ type: action, ...event });
    });

    return () => {
      channelSubscription.unbind();
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
              register={register}
              remove={remove}
              userId={userId}
              isExtra={name === event.extraTeam}
            />
          )
        }
      </div>
    </div>
  )
}

type CancelDialogProps = {
  team: string;
  playerName: string;
  action: (registration: PlayerRegistration) => Promise<ActionResult>
}

export function CancelDialog({ team, playerName, action }: CancelDialogProps) {
  const handleRemoval = async (): Promise<void> => {
    const res = await action({ team, playerName });

    if (res.error)
      return void toast.error(res.msg);

    toast.success(`El jugador ${playerName} ha cancelado`)
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            className="text-destructive"
          >
            <Delete />
          </Button>
      </AlertDialogTrigger>

      <AlertDialogContent className="w-4/5 rounded-lg">
        <AlertDialogHeader>
          <AlertDialogTitle>{playerName} está abandonando el equipo {team}</AlertDialogTitle>

          <AlertDialogDescription>
            <p>Si decides continuar asegúrate de <span className="font-bold">comunicarlo en el grupo.</span></p>

            <p>De igual forma les llegará el registro actualizado.</p>
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter>
          <AlertDialogCancel>¡Jugar!</AlertDialogCancel>

          <AlertDialogAction
            onClick={handleRemoval}
            className="bg-destructive"
          >
              Abandonar <LogOut />
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

export function SubmitButton() {
  const { pending } = useFormStatus()
 
  return (
    <Button type="submit" disabled={pending}>
      {pending ? <Loader className="animate-spin animate"/> : <UserCheck />}
    </Button>
  )
}

export function RegisterDialog({ team, players, isPlayableTeam, action }: RegisterDialogProps) {
  const [playerName, setPlayer] = useState("");
  const teamFull = isPlayableTeam && players.length >= TEAM_LIMIT;

  const remainingMsg = isPlayableTeam ? `(faltan ${TEAM_LIMIT - players.length})` : "";

  const handleRegister = async (): Promise<void> => {
    const res = await action({ team, playerName });

    if (res.error)
      return void toast.error(res.msg);

    setPlayer("");
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" className={clsx(
          "w-full",
          {
            "bg-primary": !teamFull,
            "bg-green-600 pointer-events-none": teamFull
          }
        )}>
          {teamFull ? <CircleCheckBig /> : <UserPlus />}

          {teamFull ? "Equipo completo" : `Añadir jugador ${remainingMsg}`}
        </Button>
      </DialogTrigger>

        <DialogContent className="w-4/5 rounded-lg">
          <DialogHeader>
            <DialogTitle>Registro para el equipo {team}</DialogTitle>
            <DialogDescription>
              Una vez te registres te comprometes a <span className="font-bold">llegar a tiempo</span> al evento
            </DialogDescription>
          </DialogHeader>

        <form action={handleRegister} className="flex gap-2">
          <Label htmlFor="name" className="sr-only">
            Nombre del jugador
          </Label>

          <Input
            id="link"
            placeholder="Jose Rueda"
            value={playerName}
            onChange={ev => setPlayer(ev.target.value)}
          />

          <SubmitButton />
        </form>
        </DialogContent>
    </Dialog>
  )
}
