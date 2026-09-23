import { useEffect, useRef, useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import clsx from "clsx";
import { Icon } from "@/components/ui/Icon";
import { useConversationMessages, useConversations, useSendMessage } from "@/hooks/useMessages";
import { useAuthStore } from "@/store/auth";
import { formatTime } from "@/lib/format";
import { shadows } from "@/theme/shadows";

export default function ConversationScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const { data: conversationsData } = useConversations();
  const { data: messagesData, isLoading } = useConversationMessages(id);
  const sendMessage = useSendMessage(id);
  const [input, setInput] = useState("");
  const scrollRef = useRef<ScrollView>(null);

  const conversation = conversationsData?.conversations.find((c) => c.id === id);
  const messages = messagesData?.messages ?? [];

  useEffect(() => {
    scrollRef.current?.scrollToEnd({ animated: true });
  }, [messages.length]);

  const onSend = async () => {
    const content = input.trim();
    if (!content) return;
    setInput("");
    await sendMessage.mutateAsync(content);
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} className="flex-1 bg-surface">
      <SafeAreaView edges={["top"]} className="border-b border-outline-variant/20 bg-surface px-container-padding-mobile py-4" style={shadows.softGlow}>
        <View className="flex-row items-center gap-3">
          <Pressable
            onPress={() => router.push("/messages")}
            accessibilityRole="button"
            accessibilityLabel="Retour aux messages"
            className="rounded-xl p-2 active:bg-surface-container-high"
          >
            <Icon name="arrow_back" className="text-on-surface" />
          </Pressable>
          <View className="h-10 w-10 items-center justify-center overflow-hidden rounded-xl bg-surface-container">
            <Text className="font-label-sm text-label-sm text-on-surface-variant">{conversation?.otherParticipant.firstName[0]}</Text>
          </View>
          <View>
            <Text className="font-headline-md text-body-md font-bold text-primary">
              {conversation ? `${conversation.otherParticipant.firstName} ${conversation.otherParticipant.lastName}` : "Conversation"}
            </Text>
            <Text className="text-label-sm text-on-surface-variant">
              {conversation && conversation.unreadCount > 0 ? `${conversation.unreadCount} non lu(s)` : "En ligne"}
            </Text>
          </View>
        </View>
      </SafeAreaView>

      <ScrollView ref={scrollRef} contentContainerClassName="gap-4 px-container-padding-mobile py-6" className="flex-1">
        {isLoading && <Text className="text-center font-label-sm text-label-sm text-on-surface-variant">Chargement...</Text>}

        <View className="items-center">
          <View className="rounded-full bg-surface-container-high px-3 py-1">
            <Text className="font-label-sm text-label-sm font-medium text-on-surface-variant">Conversation</Text>
          </View>
        </View>

        {messages.map((message) => {
          const isMine = message.senderId === user?.id;
          return (
            <View key={message.id} className={clsx("max-w-[85%] gap-1", isMine ? "ml-auto items-end" : "items-start")}>
              <View
                className={clsx("rounded-2xl p-4", isMine ? "rounded-br-none bg-primary-container" : "rounded-bl-none bg-surface-container-highest")}
              >
                <Text className={clsx("text-body-md", isMine ? "text-white" : "text-on-surface")}>{message.content}</Text>
              </View>
              <View className="flex-row items-center gap-1 px-1">
                <Text className="text-[10px] text-outline">{formatTime(message.createdAt)}</Text>
                {isMine && <Icon name="done_all" size={12} className="text-primary" />}
              </View>
            </View>
          );
        })}

        <View className="items-center px-4">
          <View className="max-w-sm rounded-xl border border-tertiary-container/20 bg-tertiary-fixed/30 p-3">
            <View className="flex-row items-center justify-center gap-2">
              <Icon name="verified_user" size={16} className="text-on-tertiary-fixed-variant" />
              <Text className="text-center text-label-sm text-on-tertiary-fixed-variant">
                Pour votre sécurité, effectuez vos paiements uniquement via l&apos;application.
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      <SafeAreaView edges={["bottom"]} className="border-t border-outline-variant/30 bg-surface px-container-padding-mobile py-4">
        <View className="flex-row items-center gap-3">
          <TextInput
            value={input}
            onChangeText={setInput}
            placeholder="Écrivez un message…"
            placeholderTextColor="#6f797a"
            accessibilityLabel="Message"
            className="flex-1 rounded-full bg-surface-container-low px-6 py-3 font-body-md text-body-md text-on-surface"
          />
          <Pressable
            onPress={onSend}
            accessibilityRole="button"
            accessibilityLabel="Envoyer le message"
            className="h-12 w-12 items-center justify-center rounded-full bg-primary-container active:scale-90"
          >
            <Icon name="send" size={24} className="text-white" />
          </Pressable>
        </View>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}
