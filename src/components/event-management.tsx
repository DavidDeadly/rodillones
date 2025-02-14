'use client'

import clsx from "clsx";
import { useCallback, useEffect, useReducer, useState } from "react";
import { useFormStatus } from "react-dom";
import { Calendar, CircleCheckBig, CircleX, Clock, Loader, MapPin, UserCheck, UserPlus } from "lucide-react";
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
import { useUser } from "#/lib/supabase/get-user-client";

interface EventManagementProps {
  event: Event;
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

function PlayerCard({ player, isKeeper }: { player: Player, isKeeper: boolean }) {
  const user = useUser();
  const registerByMe = player.registerBy === user?.id;

  const handleDiregister = useCallback(() => {
    if (!registerByMe) return;

    console.log(`Deregistering player ${player.name}`);
  },
    []);

  return (
    <button className={clsx(
      "col-span-2 rounded bg-secondary py-1 px-2 flex justify-center relative group",
      {
        "hover:bg-destructive transition-colors cursor-pointer": registerByMe,
        "pointer-events-none": !registerByMe
      }
    )}
      onClick={handleDiregister}
    >
      <span>{player.name}</span>

      {
        registerByMe && (
          <CircleX size={18} className="text-destructive absolute -right-2 -top-2 group-hover:invisible transition-opacity"/>
        )
      }
    </button>
  )
}

export interface TeamCardProps {
  team: string,
  players: Event['teams'][string],
  isExtra: boolean,
  register: (registration: PlayerRegistration) => Promise<ActionResult>
}

function TeamCard({ team, players, register, isExtra }: TeamCardProps) {
  const isPlayableTeam = !isExtra;

  return (
    <Card className={clsx(
      "grid grid-rows-[auto_1fr_auto]",
      {
        "border-primary border-2": isPlayableTeam,
      }
    )}>
      <CardHeader>
        <CardTitle className="text-2xl font-semibold text-center">{team}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-2">
          {players.map((player, index) => <PlayerCard key={player.name} player={player} isKeeper={index === 0} />)}
        </div>
      </CardContent>

      <CardFooter>
        <RegisterDialog team={team} players={players} isPlayableTeam={isPlayableTeam} action={register}/>
      </CardFooter>
    </Card>
  )
}

export function EventManagement({ event }: EventManagementProps) {
  const channel = event.id;
  const [state, dispatch] = useReducer(reducer, event.teams);

  const register = registerPlayerAction.bind(null, channel);

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

      <div className="w-4/5 md:w-full grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {
          Object.entries(state).map(([name, team]) => 
            <TeamCard key={name} team={name} players={team} register={register} isExtra={name === event.extraTeam}/>
          )
        }
      </div>
    </div>
  )
}

type RegisterDialogProps = {
  team: string;
  players: Player[];
  isPlayableTeam: boolean;
  action: (registration: PlayerRegistration) => Promise<ActionResult>
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
  const [open, setOpen] = useState(false);
  const teamFull = isPlayableTeam && players.length >= TEAM_LIMIT;

  const remainingMsg = isPlayableTeam ? `(faltan ${TEAM_LIMIT - players.length})` : "";

  const handleRegister = async (): Promise<void> => {
    const res = await action({ team, playerName });

    if (res.error)
      return void toast.error(res.msg);

    setPlayer("");
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild disabled={teamFull}>
        <Button variant="outline" className={clsx(
          "w-full",
          {
          "bg-primary": !teamFull,
          "bg-green-600": teamFull
          }
        )}>
          {teamFull ? <CircleCheckBig /> : <UserPlus />}

          {teamFull ? "Equipo completo" : `Añadir jugador ${remainingMsg}`}
        </Button>
      </DialogTrigger>

        <DialogContent className="w-4/5 rounded-lg">
          <DialogHeader>
            <DialogTitle>Jugarás para el equipo {team}</DialogTitle>
            <DialogDescription>
              Una vez te registres te comprometes a <span className="font-bold">llegar a tiempo</span> al evento
            </DialogDescription>
          </DialogHeader>

        <form action={handleRegister} className="flex gap-2">
          <Label htmlFor="name" className="sr-only">
            Nombre del jugador
          </Label>
          <Input id="link" placeholder="Jose Rueda" value={playerName} onChange={ev => setPlayer(ev.target.value)}/>

          <SubmitButton />
        </form>
        </DialogContent>
    </Dialog>
  )
}
