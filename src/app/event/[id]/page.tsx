import clsx from 'clsx';
import { notFound, redirect } from 'next/navigation';

import { EventManagement } from '#/components/event-management';
import { findById } from '#/lib/event.repository';
import { getServerUser } from '#/lib/supabase/get-user-server';
import { formatDate } from '#/lib/utils';
import { ConnectionCount } from '#/components/connections-count';
import { getChannelInfo } from '#/lib/pusher/channel';

interface EventProps {
  params: Promise<{ id: string }>
}

export default async function Event({ params }: EventProps) {
  const user = await getServerUser();

  if (!user) redirect("/login");

  const { id } = await params;

  const event = await findById(id);

  const noEvent = !event;
  if (noEvent) return notFound();

  const channel = event.id;
  const [subscriptions] = await getChannelInfo(channel);
  const longDate = formatDate(event.date, { dateStyle: "full" });
  const time12 = formatDate(event.date, { timeStyle: "short", hour12: true });

  return (
    <>
      <header className={clsx([
        "w-full p-4 mb-4 text-center rounded-none border-dashed border-0 border-b",
        "sticky z-50 top-0 bg-background/95 backdrop-blur-0 supports-[backdrop-filter]:bg-background/60"
      ])}>
        <h1 className="my-2 text-lg font-bold">{event.description}</h1>

        <section className="flex flex-col gap-2 text-center text-xs">
          <span>
            {longDate} - {time12}
          </span>

          <a href={event.address.url} className="underline">
            <span>{event.address.text}</span>
          </a>
        </section>
      </header>

      <EventManagement
        channel={channel}
        event={event}
        userId={user.id}
      />

      {
        subscriptions !== null &&
          <aside
            className={clsx([
              "w-full mt-4 py-2 grid place-content-center rounded-none border-dashed border-0 border-t",
              "sticky z-50 bottom-0 bg-background/95 backdrop-blur-0 supports-[backdrop-filter]:bg-background/60"
            ])}
          >
            <ConnectionCount
              channel={channel}
              subscriptions={subscriptions}
            />
          </aside>
      }
    </>
  )
}
