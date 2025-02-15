'use client'

import clsx from "clsx";
import { useEffect, useReducer, useState, useTransition } from "react";
import { useFormStatus } from "react-dom";
import { Badge, CircleCheckBig, ClockAlert, Delete, Loader, LogOut, Timer, UserCheck, UserPlus } from "lucide-react";
import { toast } from "sonner";

import { ACTION, EVENT_DATA, TEAM_LIMIT } from "#/lib/constants";
import { pusherClient } from "#/lib/pusher/pusher-client";
import { registerPlayerAction } from "#/lib/actions/register";
import { cancelRegistration } from "#/lib/actions/cancel";
import type { PlayerRegistration } from "#/lib/schemas/player-registration";
import { Event, ActionResult, Player } from '#/lib/event.repository';

import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "./ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";
import { Button } from "./ui/button";
import { Label } from "./ui/label";
import { Input } from "./ui/input";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "./ui/alert-dialog";
import { Alert, AlertDescription, AlertTitle } from "./ui/alert";

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

interface PlayerCardProps {
  team: string,
  player: Player,
  userId: string
  isKeeper: boolean,
  isPlayableTeam: boolean,
  action: (registration: PlayerRegistration) => Promise<ActionResult>
};

function PlayerCard({ team, player, userId, isPlayableTeam, action }: PlayerCardProps) {
  const registerByMe = player.registerBy === userId;

  return (
    <article className="flex items-center justify-around rounded bg-secondary h-10 pl-2">
      <span className="inline-block flex-1">{player.name}</span>

      {registerByMe && <CancelDialog team={team} playerName={player.name} isPlayableTeam={isPlayableTeam} action={action} />}
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
  const teamFull = isPlayableTeam && players.length >= TEAM_LIMIT;

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
            players.length === 0 &&
              <Alert className={clsx({ "animate-pulse": isPlayableTeam })}>
                <AlertTitle>
                  ¡Esperando jugadores!
                </AlertTitle>
              </Alert>
          }

          {players.map((player, index) =>
            <PlayerCard
              key={player.name}
              team={team}
              player={player}
              userId={userId}
              isKeeper={index === 0}
              isPlayableTeam={isPlayableTeam}
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
  isPlayableTeam: boolean;
  action: (registration: PlayerRegistration) => Promise<ActionResult>
}

export function CancelDialog({ team, playerName, isPlayableTeam, action }: CancelDialogProps) {
  const [open, setOpen] = useState(false);
  const [removing, startRemoval] = useTransition();

  const handleRemoval = async (): Promise<void> => {
    startRemoval(async () => {
      const res = await action({ team, playerName });

      if (res.error)
        return void toast.error(res.msg);

      toast.success(`El jugador ${playerName} ha cancelado`)
      setOpen(false);
    });
  }

  const titleConnector = isPlayableTeam ? `abandonando el equipo`: 'saliendo de la reserva';
  const cancelText = isPlayableTeam ? "Abandonar" : "Cancelar";

  return (
    <AlertDialog open={open}>
      <AlertDialogTrigger
        asChild
        disabled={removing} 
        onClick={() => setOpen(true)}
      >
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
          <AlertDialogTitle>{playerName} está {titleConnector} {team}</AlertDialogTitle>

          <AlertDialogDescription>
            {
              isPlayableTeam ?
                <>
                  <p>De seguir con abandonar asegúrate de <span className="font-bold">comunicarlo al grupo.</span></p>
                  <p>De igual forma les llegará el registro actualizado.</p>
                </>
                :
                <p>De tener la fecha del evento disponible agradeceriamos que <span className="font-bold">permanecer en la reserva</span>, para poder cubrir posibles inconvenientes</p>
            }
            

          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter>
          <AlertDialogCancel
            disabled={removing}
            onClick={() => setOpen(false)}
          >
            ¡Jugar!
          </AlertDialogCancel>

          <AlertDialogAction
            disabled={removing}
            onClick={handleRemoval}
            className="bg-destructive"
          >
            {cancelText} <LogOut />
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

type RegisterDialogProps = {
  team: string;
  players: Player[];
  isPlayableTeam: boolean;
  action: (registration: PlayerRegistration) => Promise<ActionResult>
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
