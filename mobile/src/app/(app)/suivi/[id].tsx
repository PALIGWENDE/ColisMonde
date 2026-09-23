import { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import * as Clipboard from "expo-clipboard";
import clsx from "clsx";
import type { BookingStatus } from "@colismonde/shared";
import { TopAppBar } from "@/components/layout/TopAppBar";
import { Icon } from "@/components/ui/Icon";
import { Button } from "@/components/ui/Button";
import { useBooking, useBookingTracking, useUploadProof } from "@/hooks/useBookings";
import { useBookingConversation } from "@/hooks/useMessages";
import { useAuthStore } from "@/store/auth";
import { BOOKING_STATUS_LABELS, formatDateTime } from "@/lib/format";
import { shadows } from "@/theme/shadows";

const TIMELINE_ORDER: BookingStatus[] = ["ACCEPTED", "PICKED_UP", "IN_TRANSIT", "DELIVERED"];

export default function TrackingScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const { data: bookingData } = useBooking(id);
  const { data: trackingData } = useBookingTracking(id);
  const { data: conversationData } = useBookingConversation(id);
  const uploadProof = useUploadProof();
  const [copied, setCopied] = useState(false);

  const booking = bookingData?.booking;
  const events = trackingData?.events ?? [];
  const isTraveler = booking?.traveler.id === user?.id;
  const counterpart = booking ? (booking.sender.id === user?.id ? booking.traveler : booking.sender) : null;

  const copyCode = async () => {
    if (!booking?.confirmationCode) return;
    await Clipboard.setStringAsync(booking.confirmationCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const pickProof = async () => {
    if (!booking || booking.status !== "DELIVERED" || !isTraveler) return;
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], quality: 0.8 });
    if (result.canceled || !result.assets[0]) return;
    const asset = result.assets[0];
    uploadProof.mutate({
      id: booking.id,
      file: { uri: asset.uri, name: asset.fileName ?? "proof.jpg", type: asset.mimeType ?? "image/jpeg" },
    });
  };

  if (!booking) {
    return (
      <View className="flex-1 bg-surface">
        <TopAppBar title="Suivi de colis" showBack />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-surface">
      <TopAppBar title="Suivi de colis" showBack actions={<Icon name="notifications" className="text-primary" />} />

      <ScrollView contentContainerClassName="gap-gutter px-container-padding-mobile pt-6 pb-12">
        <View className="rounded-xl border border-outline-variant/30 bg-surface-container-lowest p-4" style={shadows.softGlow}>
          <View className="mb-4 flex-row items-start justify-between">
            <View>
              <Text className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant">ID Expédition</Text>
              <Text className="font-headline-md text-headline-md text-primary">{booking.id.slice(0, 8).toUpperCase()}</Text>
            </View>
            <View className="rounded-full bg-secondary-container/20 px-3 py-1">
              <Text className="font-label-sm text-label-sm font-bold text-secondary">{BOOKING_STATUS_LABELS[booking.status]}</Text>
            </View>
          </View>
          <View className="flex-row items-center justify-between border-t border-outline-variant/20 pt-4">
            <View>
              <Text className="font-label-sm text-label-sm text-outline">De</Text>
              <Text className="font-label-md text-label-md text-on-background">{booking.trip.departureCity.name}</Text>
            </View>
            <View className="relative flex-1 items-center px-4">
              <View className="absolute top-1/2 w-full border-t border-dashed border-outline-variant" />
              <Icon name="flight_takeoff" filled className="bg-surface-container-lowest px-2 text-primary-container" />
            </View>
            <View className="items-end">
              <Text className="font-label-sm text-label-sm text-outline">À</Text>
              <Text className="font-label-md text-label-md text-on-background">{booking.trip.arrivalCity.name}</Text>
            </View>
          </View>
        </View>

        {booking.confirmationCode && (
          <View className="overflow-hidden rounded-xl bg-primary-container p-6">
            <Text className="mb-2 font-label-md text-label-md text-on-primary-container">Code de confirmation</Text>
            <Pressable onPress={copyCode} accessibilityLabel="Copier le code" className="mt-4 flex-row justify-between gap-2">
              {booking.confirmationCode.split("").map((digit, i) => (
                <View key={i} className="h-14 w-12 items-center justify-center rounded-lg border border-on-primary/20 bg-on-primary/10">
                  <Text className="font-headline-md text-headline-md text-on-primary">{digit}</Text>
                </View>
              ))}
            </Pressable>
            <Text className="mt-4 font-label-sm text-label-sm italic text-on-primary/80">
              {copied ? "Code copié dans le presse-papier !" : "Présentez ce code au voyageur lors de la réception."}
            </Text>
          </View>
        )}

        <View className="py-4">
          <Text className="mb-6 font-headline-md text-headline-md text-on-surface">Suivi détaillé</Text>
          <View className="gap-10 pl-10">
            {TIMELINE_ORDER.map((status) => {
              const event = events.find((e) => e.status === status);
              const done = Boolean(event);
              const isCurrent = booking.status === status;
              return (
                <View key={status} className={clsx("relative", !done && "opacity-50")}>
                  <View
                    className={clsx(
                      "absolute -left-10 h-8 w-8 items-center justify-center rounded-full",
                      done ? (isCurrent ? "bg-primary-container" : "bg-primary") : "border-2 border-outline-variant bg-surface-container-high",
                    )}
                  >
                    {done ? (
                      isCurrent ? (
                        <View className="h-2.5 w-2.5 rounded-full bg-white" />
                      ) : (
                        <Icon name="check" size={18} className="text-white" />
                      )
                    ) : (
                      <Icon name="inventory_2" size={18} className="text-outline-variant" />
                    )}
                  </View>
                  <View className="flex-row items-baseline justify-between">
                    <Text className={clsx("font-label-md text-label-md text-on-surface", isCurrent && "font-bold text-primary")}>
                      {event?.label ?? BOOKING_STATUS_LABELS[status]}
                    </Text>
                    <Text className="font-label-sm text-label-sm text-outline">
                      {event ? formatDateTime(event.occurredAt) : isCurrent ? "Actuel" : "À venir"}
                    </Text>
                  </View>
                  {event?.description && <Text className="font-body-md text-body-md text-on-surface-variant">{event.description}</Text>}
                  {event?.location && (
                    <View className="mt-1 flex-row items-center gap-1">
                      <Icon name="location_on" size={14} className="text-outline" />
                      <Text className="font-label-sm text-label-sm text-outline">{event.location}</Text>
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        </View>

        <View className="gap-4">
          <Text className="font-headline-md text-headline-md text-on-surface">Preuve de livraison</Text>
          <Pressable
            onPress={pickProof}
            className="items-center justify-center rounded-xl border-2 border-dashed border-outline-variant bg-surface-container-low px-6 py-10"
          >
            {booking.proofPhotoUrl ? (
              <View className="mb-4 h-48 w-full max-w-[280px] overflow-hidden rounded-lg">
                <Image source={{ uri: booking.proofPhotoUrl }} style={{ width: "100%", height: "100%" }} contentFit="cover" />
              </View>
            ) : (
              <View className="mb-4 h-32 w-full max-w-[280px] items-center justify-center rounded-lg bg-surface-container">
                <Icon name="photo_camera" size={40} className="text-outline-variant" />
              </View>
            )}
            <Text className="font-label-md text-label-md text-on-surface-variant">
              {booking.proofPhotoUrl ? "Photo enregistrée" : "La photo apparaîtra ici une fois livrée"}
            </Text>
            {booking.status === "DELIVERED" && isTraveler && !booking.proofPhotoUrl && (
              <Text className="font-label-sm text-label-sm text-outline">Appuyez pour ajouter une photo de preuve</Text>
            )}
          </Pressable>
        </View>

        {counterpart && (
          <View className="flex-row items-center gap-4 rounded-xl bg-surface-container-highest p-4">
            <View className="h-12 w-12 overflow-hidden rounded-full bg-surface-container">
              {counterpart.avatarUrl ? (
                <Image source={{ uri: counterpart.avatarUrl }} style={{ width: 48, height: 48 }} contentFit="cover" />
              ) : (
                <View className="h-full w-full items-center justify-center">
                  <Text className="font-label-md text-label-md text-on-surface-variant">{counterpart.firstName[0]}</Text>
                </View>
              )}
            </View>
            <View className="flex-1">
              <Text className="font-label-md text-label-md text-on-background">
                {counterpart.firstName} {counterpart.lastName}
              </Text>
              <View className="flex-row items-center gap-1">
                <Icon name="star" filled className="text-secondary" size={16} />
                <Text className="font-label-sm text-label-sm text-on-surface-variant">{counterpart.ratingAvg.toFixed(1)}</Text>
              </View>
            </View>
            <Button
              size="md"
              disabled={!conversationData?.conversationId}
              onPress={() =>
                conversationData &&
                router.push({ pathname: "/messages/[id]", params: { id: conversationData.conversationId } })
              }
            >
              <Icon name="chat_bubble" size={18} className="text-on-primary" />
              <Text className="font-label-md text-label-md font-semibold text-on-primary">Contacter</Text>
            </Button>
          </View>
        )}
      </ScrollView>
    </View>
  );
}
