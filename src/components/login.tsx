"use client";

import { Loader, SendHorizontal} from "lucide-react";
import { useActionState, useRef } from "react";

import { Button } from '#/components/ui/button';
import { Input } from '#/components/ui/input';
import { Label } from '#/components/ui/label';
import { InputOTP, InputOTPGroup, InputOTPSeparator, InputOTPSlot } from '#/components/ui/input-otp';
import { loginPasslessPhone } from '#/lib/actions/login';


export function Login() {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, login, isPending] = useActionState(loginPasslessPhone, {
    error: false
  });

  if (state.error)
    return <h1>{state.msg}</h1>

  return (
    <main className='h-svh grid content-center justify-center'>
      <form ref={formRef} action={login} className='flex flex-col gap-4'>
      {
        state.data ? (
          <div className="flex flex-col items-center gap-4 w-4/5 text-center m-auto">
            <Label htmlFor="otp" className="font-semibold text-lg">Hemos mandado un código de verificación a tu celular</Label>

            <InputOTP
                id="otp"
                name="otp"
                maxLength={6}
                onComplete={() => formRef.current?.requestSubmit()}
                disabled={isPending}
              >
              <InputOTPGroup>
                <InputOTPSlot index={0} />
                <InputOTPSlot index={1} />
                <InputOTPSlot index={2} />
              </InputOTPGroup>

              <InputOTPSeparator />

              <InputOTPGroup>
                <InputOTPSlot index={3} />
                <InputOTPSlot index={4} />
                <InputOTPSlot index={5} />
              </InputOTPGroup>
            </InputOTP>
          </div>
        )
        :
        (
          <>
            <section className="flex flex-col gap-2">
              <Label htmlFor="phone" className="text-lg">¡Bienvenido, gomoso!</Label>

              <Input id="phone" name="phone" placeholder="Número de celular" disabled={isPending} />
            </section>

            <Button type="submit" className="w-full px-3" disabled={isPending}>
              <span>{isPending ? 'Cargando...' : 'Enviar código'}</span>
              {isPending ? <Loader className="animate-spin animate"/> : <SendHorizontal />}
            </Button>
          </>
        )
      }
      </form>
    </main>
  )

}
