'use client';

import { toast } from "sonner";
import { useState, useTransition } from "react";

import { PlayerRegistration } from "#/lib/schemas/player-registration";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "./ui/alert-dialog";
import { Button } from "./ui/button";
import { Delete, LogOut } from "lucide-react";
import { ActionResult } from "#/lib/event.repository";

type CancelDialogProps = {
  team: string;
  playerName: string;
  isPlayableTeam: boolean;
  action: (registration: Omit<PlayerRegistration, 'isKeeper'>) => Promise<ActionResult>
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

  const titleConnector = isPlayableTeam ? "abandonando el equipo": "saliendo de la reserva";
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
