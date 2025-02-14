import { Login } from '#/components/login';
import { getServerUser } from '#/lib/supabase/get-user-server';
import { redirect } from 'next/navigation';

export default async function LoginPage() {
  const user = await getServerUser();

  if (user) redirect("event/67a91921d729657addde107a");

  return (
    <main className='h-svh grid content-center justify-center'>
      <Login />
    </main>
  )
}

