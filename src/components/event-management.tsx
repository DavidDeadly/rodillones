'use client'

import clsx from "clsx";
import { useEffect, useReducer, useState } from "react";

import { ACTION, EVENTS } from "#/lib/constants";
import { pusherClient } from "#/lib/pusher-client";
import { registerPlayerAction } from "#/lib/action";
import { Event, RegisterResult } from '#/lib/event.repository';

import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "./ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";
import { Button } from "./ui/button";
import { Label } from "./ui/label";
import { Input } from "./ui/input";
import { useFormStatus } from "react-dom";
import { Loader, UserCheck } from "lucide-react";

interface EventManagementProps {
  event: Event;
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

  const register = registerPlayerAction.bind(null, channel);

  useEffect(() => {
    const channelSubscription = pusherClient.subscribe(channel);

    const action = ACTION.INSCRIPTION;
    channelSubscription.bind(action, (event: EVENTS[typeof action]) => {
      dispatch({ type: action, ...event });
    });

    return () => {
      channelSubscription.unbind();
      channelSubscription.unsubscribe();
    }
  }, []);

  return (
    <div className="w-full my-4 flex flex-col gap-5 items-center">
      <div className="w-52 border-[#9cd4bd] border-2 rounded p-4 text-center">
        <h1 className="text-xl font-bold">
          { event.address }
        </h1>

        <p>{event.description}</p>

        <p>{event.date.toLocaleDateString()} - {event.date.toLocaleTimeString()}</p>
      </div>

      {
        Object.entries(state).map(([name, team]) => (
            <Card key={name} className="w-4/5" >
              <CardHeader>
                <CardTitle className="text-center">{name}</CardTitle>
              </CardHeader>
              <CardContent>
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
              </CardContent>
              <CardFooter>
                <RegisterDialog team={name} action={register}/>
              </CardFooter>
            </Card>
          ))
      }

    </div>
  )
}

type RegisterDialogProps = {
  team: string;
  action: (registration: EVENTS[ACTION.INSCRIPTION]) => Promise<RegisterResult>
}

export function SubmitButton() {
  const { pending } = useFormStatus()
 
  return (
    <Button type="submit" disabled={pending}>
      {pending ? <Loader className="animate-spin animate"/> : <UserCheck />}
    </Button>
  )
}

export function RegisterDialog({ team, action }: RegisterDialogProps) {
  const [player, setPlayer] = useState("");
  const [open, setOpen] = useState(false);

  const handleRegister = async () => {
    const res = await action({ team, player });

    if (res.error) {
      console.error(res.msg);
      return;
    }

    setPlayer("");
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger>
        <Button>Registrarse</Button>
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
          <Input id="link" placeholder="Jose Rueda" value={player} onChange={ev => setPlayer(ev.target.value)}/>

          <SubmitButton />
        </form>
        </DialogContent>
    </Dialog>
  )
}
