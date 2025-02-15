'use client';
import { useEffect, useState } from "react";

import { pusherClient } from "#/lib/pusher/pusher-client";
import { ChannelInfo } from "#/lib/pusher/channel";

import { Badge } from "./ui/badge";
import clsx from "clsx";

type ConnectionCountProps = {
  subscriptions: number;
  channel: string
};

const SubscriptionEvent = 'pusher:subscription_count';
type SubscriptionCountEvent = Pick<ChannelInfo, 'subscription_count'>;

export function ConnectionCount({ subscriptions, channel }: ConnectionCountProps) {
  const [viewers, setViewers] = useState(subscriptions);

  useEffect(() => {
    const channelSubscription = pusherClient.subscribe(channel);

    channelSubscription.bind(SubscriptionEvent, (data: SubscriptionCountEvent) =>
      setViewers(data.subscription_count)
    );
  }, []);

  const msg = viewers > 1 ? `${viewers} Rodillones connectados` : `Estás solo`

  return (
    <Badge variant="outline" className="flex items-center py-2 gap-2" >
      <span className={clsx(
        "flex h-2 w-2 rounded-full bg-green-500 animate-ping",
        {
          "animate-ping": viewers > 1,
          "animate-none": viewers === 1
        }
      )}/>

      <span className="text-muted-foreground">{msg}</span>
    </Badge>
  )
}
