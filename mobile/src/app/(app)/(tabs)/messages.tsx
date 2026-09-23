import { FlatList, Pressable, Text, View } from "react-native";
import { Link } from "expo-router";
import { Image } from "expo-image";
import { TopAppBar } from "@/components/layout/TopAppBar";
import { Icon } from "@/components/ui/Icon";
import { useConversations } from "@/hooks/useMessages";
import { formatTime } from "@/lib/format";
import type { ConversationDTO } from "@colismonde/shared";

export default function MessagesListScreen() {
  const { data, isLoading } = useConversations();
  const conversations = data?.conversations ?? [];

  return (
    <View className="flex-1 bg-surface">
      <TopAppBar title="Messages" />

      {isLoading && (
        <View className="gap-3 px-container-padding-mobile pt-4">
          {[0, 1, 2].map((i) => (
            <View key={i} className="h-20 rounded-2xl bg-surface-container" />
          ))}
        </View>
      )}

      {!isLoading && conversations.length === 0 && (
        <View className="mt-10 items-center gap-3 px-container-padding-mobile">
          <Icon name="chat_bubble" size={48} className="text-outline-variant" />
          <Text className="text-center font-body-md text-body-md text-on-surface-variant">
            Vos conversations apparaîtront ici dès qu&apos;une réservation sera acceptée.
          </Text>
        </View>
      )}

      <FlatList
        data={conversations}
        keyExtractor={(c) => c.id}
        contentContainerClassName="px-container-padding-mobile"
        ItemSeparatorComponent={() => <View className="h-px bg-outline-variant/10" />}
        renderItem={({ item: c }: { item: ConversationDTO }) => (
          <Link href={{ pathname: "/messages/[id]", params: { id: c.id } }} asChild>
            <Pressable className="flex-row items-center gap-4 py-4">
              <View className="h-14 w-14 overflow-hidden rounded-full bg-surface-container">
                {c.otherParticipant.avatarUrl ? (
                  <Image source={{ uri: c.otherParticipant.avatarUrl }} style={{ width: 56, height: 56 }} contentFit="cover" />
                ) : (
                  <View className="h-full w-full items-center justify-center">
                    <Text className="font-label-md text-label-md text-on-surface-variant">{c.otherParticipant.firstName[0]}</Text>
                  </View>
                )}
              </View>
              <View className="flex-1">
                <View className="flex-row items-center justify-between">
                  <Text className="font-label-md text-label-md text-on-surface">
                    {c.otherParticipant.firstName} {c.otherParticipant.lastName}
                  </Text>
                  {c.lastMessage && <Text className="font-label-sm text-label-sm text-outline">{formatTime(c.lastMessage.createdAt)}</Text>}
                </View>
                <Text numberOfLines={1} className="font-body-md text-body-md text-on-surface-variant">
                  {c.lastMessage?.content ?? "Nouvelle conversation"}
                </Text>
              </View>
              {c.unreadCount > 0 && (
                <View className="h-6 w-6 items-center justify-center rounded-full bg-primary-container">
                  <Text className="text-xs font-bold text-on-primary">{c.unreadCount}</Text>
                </View>
              )}
            </Pressable>
          </Link>
        )}
      />
    </View>
  );
}
