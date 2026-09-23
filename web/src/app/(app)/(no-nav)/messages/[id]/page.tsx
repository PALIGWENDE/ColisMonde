"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { Icon } from "@/components/ui/Icon";
import { useConversationMessages, useConversations, useSendMessage } from "@/hooks/useMessages";
import { useAuthStore } from "@/store/auth";
import { formatTime } from "@/lib/format";

export default function ConversationPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const { data: conversationsData } = useConversations();
  const { data: messagesData, isLoading } = useConversationMessages(params.id);
  const sendMessage = useSendMessage(params.id);
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  const conversation = conversationsData?.conversations.find((c) => c.id === params.id);
  const messages = messagesData?.messages ?? [];

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  const onSend = async (e: React.FormEvent) => {
    e.preventDefault();
    const content = input.trim();
    if (!content) return;
    setInput("");
    await sendMessage.mutateAsync(content);
  };

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      <header className="sticky top-0 z-50 border-b border-outline-variant/20 bg-surface px-container-padding-mobile py-4 shadow-soft-glow">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push("/messages")}
              aria-label="Retour aux messages"
              className="rounded-xl p-2 text-on-surface transition-colors hover:bg-surface-container-high active:scale-95"
            >
              <Icon name="arrow_back" />
            </button>
            <div className="flex items-center gap-3">
              <div className="relative h-10 w-10 overflow-hidden rounded-xl bg-surface-container">
                {conversation?.otherParticipant.avatarUrl ? (
                  <Image src={conversation.otherParticipant.avatarUrl} alt="" fill className="object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center font-label-sm text-label-sm">
                    {conversation?.otherParticipant.firstName[0]}
                  </div>
                )}
              </div>
              <div>
                <h1 className="font-headline-md text-body-md font-bold text-primary">
                  {conversation ? `${conversation.otherParticipant.firstName} ${conversation.otherParticipant.lastName}` : "Conversation"}
                </h1>
                <p className="text-label-sm text-on-surface-variant">
                  {conversation && conversation.unreadCount > 0 ? `${conversation.unreadCount} non lu(s)` : "En ligne"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 space-y-6 overflow-y-auto px-container-padding-mobile py-6">
        {isLoading && (
          <p aria-live="polite" className="text-center font-label-sm text-label-sm text-on-surface-variant">
            Chargement…
          </p>
        )}

        <div className="flex justify-center">
          <span className="rounded-full bg-surface-container-high px-3 py-1 font-label-sm text-label-sm font-medium text-on-surface-variant">
            Conversation
          </span>
        </div>

        {messages.map((message) => {
          const isMine = message.senderId === user?.id;
          return (
            <div key={message.id} className={isMine ? "ml-auto flex max-w-[85%] flex-col items-end gap-1 md:max-w-[70%]" : "flex max-w-[85%] items-end gap-3 md:max-w-[70%]"}>
              {!isMine && <div className="h-8 w-8 shrink-0 rounded-full bg-surface-container" />}
              <div className="space-y-1">
                <div className={isMine ? "rounded-2xl rounded-br-none bg-primary-container p-4 text-white shadow-lg" : "rounded-2xl rounded-bl-none bg-surface-container-highest p-4 text-on-surface shadow-soft-glow"}>
                  <p className="text-body-md">{message.content}</p>
                </div>
                <p className={isMine ? "flex items-center justify-end gap-1 px-1 text-[10px] text-outline" : "px-1 text-[10px] text-outline"}>
                  {formatTime(message.createdAt)}
                  {isMine && <Icon name="done_all" size={12} className="text-primary" />}
                </p>
              </div>
            </div>
          );
        })}

        <div className="flex justify-center px-4">
          <div className="max-w-sm rounded-xl border border-tertiary-container/20 bg-tertiary-fixed/30 p-3 text-center">
            <p className="flex items-center justify-center gap-2 text-label-sm text-on-tertiary-fixed-variant">
              <Icon name="verified_user" size={16} />
              Pour votre sécurité, effectuez vos paiements uniquement via l&apos;application.
            </p>
          </div>
        </div>
        <div ref={bottomRef} />
      </main>

      <footer className="z-50 border-t border-outline-variant/30 bg-surface px-container-padding-mobile py-4 pb-safe">
        <form onSubmit={onSend} className="mx-auto flex max-w-5xl items-center gap-3">
          <div className="relative flex-1">
            <label htmlFor="message-input" className="sr-only">
              Message
            </label>
            <input
              id="message-input"
              name="message"
              autoComplete="off"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="w-full rounded-full border-none bg-surface-container-low px-6 py-3 pr-12 text-body-md shadow-inner placeholder:text-outline/70 focus:outline-none focus:ring-2 focus:ring-primary-container"
              placeholder="Écrivez un message…"
            />
          </div>
          <button
            type="submit"
            aria-label="Envoyer le message"
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-brand-gradient text-white shadow-md transition-transform active:scale-90"
          >
            <Icon name="send" size={24} />
          </button>
        </form>
      </footer>
    </div>
  );
}
