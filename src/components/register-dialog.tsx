'use client';

import clsx from "clsx";
import { CircleCheckBig, Loader, UserCheck, UserPlus } from "lucide-react";
import { useFormStatus } from "react-dom";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Player } from "#/lib/db/client";
import { PlayerRegistration } from "#/lib/schemas/player-registration";
import { Button } from "./ui/button";
import { ActionResult } from "#/lib/event.repository";
import { TEAM_LIMIT } from "#/lib/constants";
import { getPlural } from "#/lib/utils";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";
import { Label } from "./ui/label";
import { Input } from "./ui/input";
import { Checkbox } from "./ui/checkbox";

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
  const [isKeeper, setIsKeeper] = useState(false);
  const [onlyKeeperLeft, setOnlyKeeperLeft] = useState(false);

  const teamFull = isPlayableTeam && players.length >= TEAM_LIMIT;

  const playersLeft = TEAM_LIMIT - players.length;
  const leftWord = getPlural({
    num: playersLeft,
    one: 'falta',
    other: 'faltan'
  });

  const remainingMsg = isPlayableTeam ? `(${leftWord} ${playersLeft})` : "";
  const alreadyKeeper = players.some(player => player.isKeeper);
  const showKeeperCheck = isPlayableTeam && !alreadyKeeper;

  const handleRegister = async (): Promise<void> => {
    const res = await action({ team, playerName, isKeeper });

    if (res.error)
      return void toast.error(res.msg);

    toast.success(`El jugador ${playerName} ha sido registrado`);
    setPlayer("");
  }

  useEffect(() => {
    const isExtraTeam = !isPlayableTeam;
    if (isExtraTeam) return;

    const fieldPlayers = players.filter((player) => !player.isKeeper);
    const onlyNeedKeeper = fieldPlayers.length === TEAM_LIMIT - 1;
    
    setOnlyKeeperLeft(onlyNeedKeeper);
    setIsKeeper(alreadyKeeper ? false : onlyNeedKeeper);
  }, [players, isPlayableTeam]);

  const playerType = onlyKeeperLeft ? 'arquero' : 'jugador';
  const titleConnector = isPlayableTeam ? "para el equipo": "en";

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

          {teamFull
            ? <span className="font-bold">Equipo completo</span>
            : <>Añadir {playerType} <span className="font-bold">{remainingMsg}</span></>
          }
        </Button>
      </DialogTrigger>

        <DialogContent className="w-4/5 rounded-lg">
          <DialogHeader>
          <DialogTitle>Registro {titleConnector} {team}</DialogTitle>

            <DialogDescription>
            {
              isPlayableTeam ?
                <>Una vez te registres te comprometes a <span className="font-bold">llegar a tiempo</span> al evento</>
                :
                <>
                  <p>La reserva entra en <span className="font-bold">orden de registro</span>.</p>
                  <p>Estar pendiente del grupo para cuando se libere un campo</p>
                </>
            }
            </DialogDescription>
          </DialogHeader>

        <form action={handleRegister} className="flex flex-col gap-4">
          <section className="flex gap-2">
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
          </section>

          {
            showKeeperCheck &&
              <section className="flex gap-2">
                <Checkbox
                  id="isKeeper"
                  checked={isKeeper}
                  disabled={onlyKeeperLeft}
                  onClick={() => setIsKeeper(wasKeeper => !wasKeeper)} />

                <label
                  htmlFor="isKeeper"
                  className="text-sm font-extrabold leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Registrar como Arquero 🧤
                </label>
              </section>
          }
        </form>
        </DialogContent>
    </Dialog>
  )
}
