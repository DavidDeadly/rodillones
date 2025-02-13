"use client";

import { toast } from "sonner";
import { REGEXP_ONLY_DIGITS } from "input-otp";
import { Loader, SendHorizontal, UsersRound} from "lucide-react";
import { RefObject, useActionState, useEffect, useRef } from "react";

import { Button } from '#/components/ui/button';
import { Input } from '#/components/ui/input';
import { Label } from '#/components/ui/label';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '#/components/ui/input-otp';
import { loginPasslessPhone } from '#/lib/actions/login';
import { Alert, AlertDescription, AlertTitle } from "#/components/ui/alert";

function usePrevious<T>(value: T) {
  const ref = useRef<T>(null);

  useEffect(() => {
    ref.current = value;
  }, [value]);

  return ref.current;
}

function ToTPInput({ pending, formRef }: {
  pending: boolean, formRef: RefObject<HTMLFormElement | null>
}) {

  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor="otp" className="font-semibold text-lg">Código de 1 uso</Label>

      <InputOTP
        id="otp"
        name="otp"
        maxLength={4}
        disabled={pending}
        pattern={REGEXP_ONLY_DIGITS}
        onComplete={() => formRef?.current?.requestSubmit()}
      >
        <InputOTPGroup>
          <InputOTPSlot index={0} />
          <InputOTPSlot index={1} />
          <InputOTPSlot index={2} />
          <InputOTPSlot index={3} />
        </InputOTPGroup>
      </InputOTP>

      <span className="text-sm font-thin text-muted-foreground">
        Ingresa el código que se te envió a tu celular
      </span>
    </div>
  )
}

export function PhoneInput({ pending }: { pending: boolean }) {
  return (
    <>
      <section className="flex flex-col gap-2">
        <Label htmlFor="phone" className="font-bold text-xl">¡Bienvenido!</Label>

        <Alert className="bg-secondary">
          <UsersRound className="h-4 w-4" />
          <AlertTitle className="text-secondary-foreground font-semibold">¡Solo gomosos!</AlertTitle>
          <AlertDescription>
            Solo puedes entrar si estás en el grupo de {''}
            <span className="italic">WhatsApp</span> {''}
            <span className="font-bold">RODILLONES</span>
          </AlertDescription>
        </Alert>

        <Input id="phone" name="phone" placeholder="Número de celular" disabled={pending} />
      </section>

      <Button type="submit" className="w-full px-3" disabled={pending}>
        <span>{pending ? 'Cargando...' : 'Enviar código'}</span>
        {pending ? <Loader className="animate-spin animate"/> : <SendHorizontal />}
      </Button>
    </>
  )
}

export function Login() {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, login, pending] = useActionState(loginPasslessPhone, {
    error: false
  });
  const prevState = usePrevious(state);

  useEffect(() => {
    if (state.error) {
      toast.error(state.msg);

      return;
    }

    const retry = JSON.stringify(prevState) === JSON.stringify(state);

    if (retry) toast.info("Código incorrecto intenta de nuevo");

  }, [state]);

  return (
    <form ref={formRef} action={login} className='w-4/5 m-auto flex flex-col gap-4'>
      {
        !state.error && state.data
          ? <ToTPInput pending={pending} formRef={formRef} />
          : <PhoneInput pending={pending} />
      }
    </form>
  )

}
