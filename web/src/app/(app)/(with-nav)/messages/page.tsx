"use client";

import Link from "next/link";
import Image from "next/image";
import { TopAppBar } from "@/components/layout/TopAppBar";
import { Icon } from "@/components/ui/Icon";
import { useConversations } from "@/hooks/useMessages";
import { formatTime } from "@/lib/format";

export default function MessagesListPage() {
  const { data, isLoading } = useConversations();
  const conversations = data?.conversations ?? [];

  return (
    <div>
      <TopAppBar title="Messages" />
      <main className="mx-auto max-w-2xl px-container-padding-mobile pt-4">
        {isLoading && (
          <div className="space-y-3 pt-4">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-20 animate-pulse rounded-2xl bg-surface-container" />
            ))}
          </div>
        )}

        {!isLoading && conversations.length === 0 && (
          <div className="mt-10 flex flex-col items-center gap-3 text-center">
            <Icon name="chat_bubble" size={48} className="text-outline-variant" />
            <p className="font-body-md text-body-md text-on-surface-variant">
              Vos conversations apparaîtront ici dès qu&apos;une réservation sera acceptée.
            </p>
          </div>
        )}

        <div className="divide-y divide-outline-variant/10">
          {conversations.map((c) => (
            <Link key={c.id} href={`/messages/${c.id}`} className="flex items-center gap-4 py-4 transition-colors hover:bg-surface-container-low">
              <div className="relative h-14 w-14 flex-shrink-0 overflow-hidden rounded-full bg-surface-container">
                {c.otherParticipant.avatarUrl ? (
                  <Image src={c.otherParticipant.avatarUrl} alt={c.otherParticipant.firstName} fill className="object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center font-label-md text-label-md text-on-surface-variant">
                    {c.otherParticipant.firstName[0]}
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <p className="font-label-md text-label-md text-on-surface">
                    {c.otherParticipant.firstName} {c.otherParticipant.lastName}
                  </p>
                  {c.lastMessage && <span className="font-label-sm text-label-sm text-outline">{formatTime(c.lastMessage.createdAt)}</span>}
                </div>
                <p className="truncate font-body-md text-body-md text-on-surface-variant">{c.lastMessage?.content ?? "Nouvelle conversation"}</p>
              </div>
              {c.unreadCount > 0 && (
                <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-primary-container text-xs font-bold text-on-primary">
                  {c.unreadCount}
                </span>
              )}
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
