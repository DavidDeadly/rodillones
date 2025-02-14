import { notFound } from 'next/navigation';

import { EventManagement } from '#/components/event-management';
import { findById } from '#/lib/event.repository';
import { getServerUser } from '#/lib/supabase/get-user-server';

interface EventProps {
  params: Promise<{ id: string }>
}

export default async function Event({ params }: EventProps) {
  const user = await getServerUser();

  console.log({ user })

  const { id } = await params;

  const event = await findById(id);

  const noEvent = !event;
  if (noEvent) return notFound();

  return <EventManagement event={event}/>
}
