import { EventManagement } from '#/components/event-management';
import { findById } from '#/lib/event.repository';
import { getGroupParticipants } from '#/lib/whatsapp.service';
import { notFound } from 'next/navigation';

interface EventProps {
  params: Promise<{ id: string }>
}

export default async function Event({ params }: EventProps) {
  const { id } = await params;

  const event = await findById(id);

  const noEvent = !event;
  if (noEvent) return notFound();

  return <EventManagement event={event}/>
}
