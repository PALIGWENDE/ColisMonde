import { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { Link, useRouter } from "expo-router";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import * as DocumentPicker from "expo-document-picker";
import clsx from "clsx";
import { SafeAreaView } from "react-native-safe-area-context";
import type { BookingDTO } from "@colismonde/shared";
import { Icon } from "@/components/ui/Icon";
import { useAuthStore } from "@/store/auth";
import { useLogout } from "@/hooks/useAuthActions";
import { useMyDocuments, useUploadAvatar, useUploadDocument } from "@/hooks/useUsers";
import { useMyBookings } from "@/hooks/useBookings";
import { useUserReviews } from "@/hooks/useReviews";
import { BOOKING_STATUS_LABELS, CATEGORY_LABELS, formatDate, formatPrice } from "@/lib/format";
import { shadows } from "@/theme/shadows";

type Tab = "sender" | "traveler";

export default function ProfilScreen() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const logout = useLogout();
  const uploadAvatar = useUploadAvatar();
  const uploadDocument = useUploadDocument();
  const [tab, setTab] = useState<Tab>("sender");

  const { data: senderBookings } = useMyBookings("sender");
  const { data: travelerBookings } = useMyBookings("traveler");
  const { data: reviewsData } = useUserReviews(user?.id);
  const { data: documentsData } = useMyDocuments();

  if (!user) return null;

  const latestDocument = documentsData?.documents[0];
  const kyc = user.isVerified
    ? { label: "Profil vérifié", sublabel: "Identité et documents validés", tone: "verified" as const }
    : latestDocument?.status === "PENDING"
      ? { label: "Vérification en attente", sublabel: "Votre document est en cours d'examen", tone: "pending" as const }
      : latestDocument?.status === "REJECTED"
        ? { label: "Document refusé", sublabel: "Envoyez une nouvelle photo lisible de votre pièce d'identité", tone: "rejected" as const }
        : { label: "Vérifier mon profil", sublabel: "Ajoutez une pièce d'identité", tone: "none" as const };

  const deliveredAsTraveler = (travelerBookings?.bookings ?? []).filter((b) => b.status === "DELIVERED");
  const totalEarnings = deliveredAsTraveler.reduce((sum, b) => sum + b.agreedPrice, 0);
  const shipmentsCount = senderBookings?.bookings.length ?? 0;
  const tripsCount = travelerBookings?.bookings.length ?? 0;

  const pickAvatar = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], quality: 0.8, allowsEditing: true, aspect: [1, 1] });
    if (result.canceled || !result.assets[0]) return;
    const asset = result.assets[0];
    uploadAvatar.mutate({ uri: asset.uri, name: asset.fileName ?? "avatar.jpg", type: asset.mimeType ?? "image/jpeg" });
  };

  const pickDocument = async () => {
    const result = await DocumentPicker.getDocumentAsync({ type: ["image/*", "application/pdf"] });
    if (result.canceled || !result.assets[0]) return;
    const asset = result.assets[0];
    uploadDocument.mutate({
      file: { uri: asset.uri, name: asset.name, type: asset.mimeType ?? "image/jpeg" },
      type: "ID_CARD",
    });
  };

  return (
    <View className="flex-1 bg-surface">
      <SafeAreaView edges={["top"]} className="flex-row items-center justify-between px-container-padding-mobile py-4" style={shadows.softGlow}>
        <Icon name="language" className="text-primary" />
        <Text className="font-headline-md text-headline-md font-bold text-primary">ColisMonde</Text>
        <Icon name="notifications" className="text-on-surface-variant" />
      </SafeAreaView>

      <ScrollView contentContainerClassName="px-container-padding-mobile pb-8">
        <View className="mb-8 items-center pt-6">
          <Pressable onPress={pickAvatar} accessibilityRole="button" accessibilityLabel="Changer la photo de profil" className="relative">
            <View className="mb-4 h-28 w-28 overflow-hidden rounded-full border-4 border-white bg-surface-container" style={shadows.softGlow}>
              {user.avatarUrl ? (
                <Image source={{ uri: user.avatarUrl }} style={{ width: 112, height: 112 }} contentFit="cover" />
              ) : (
                <View className="h-full w-full items-center justify-center">
                  <Text className="font-headline-lg text-headline-lg text-on-surface-variant">
                    {user.firstName[0]}
                    {user.lastName[0]}
                  </Text>
                </View>
              )}
            </View>
            {user.isVerified && (
              <View className="absolute bottom-4 right-0 rounded-full border-2 border-white bg-primary p-1">
                <Icon name="verified" filled className="text-white" size={18} />
              </View>
            )}
          </Pressable>

          <Text className="font-headline-lg-mobile text-headline-lg-mobile text-on-background">
            {user.firstName} {user.lastName}
          </Text>
          {(user.city || user.country) && (
            <View className="mt-1 flex-row items-center gap-2">
              <Icon name="location_on" size={16} className="text-primary" />
              <Text className="font-label-md text-label-md text-on-surface-variant">{[user.city, user.country].filter(Boolean).join(", ")}</Text>
            </View>
          )}

          <View className="mt-8 w-full flex-row rounded-xl bg-white p-4" style={shadows.softGlow}>
            <Stat value={shipmentsCount} label="Envois" />
            <Stat value={tripsCount} label="Trajets" border />
            <View className="flex-1 items-center">
              <View className="flex-row items-center gap-1">
                <Text className="font-headline-md text-headline-md text-primary">{user.ratingAvg.toFixed(1)}</Text>
                <Icon name="star" filled className="text-secondary-container" size={16} />
              </View>
              <Text className="font-label-sm text-label-sm uppercase tracking-wider text-outline">Note</Text>
            </View>
          </View>
        </View>

        <Pressable
          onPress={pickDocument}
          disabled={uploadDocument.isPending}
          className={clsx(
            "mb-8 flex-row items-center justify-between rounded-xl border p-4",
            kyc.tone === "rejected" ? "border-error/30 bg-error-container/30" : "border-primary-container/20 bg-primary-container/10",
          )}
        >
          <View className="flex-row items-center gap-3">
            <View className={clsx("rounded-lg p-2", kyc.tone === "rejected" ? "bg-error" : "bg-primary-container")}>
              <Icon name={kyc.tone === "pending" ? "schedule" : kyc.tone === "rejected" ? "info" : "verified_user"} className="text-white" />
            </View>
            <View className="flex-1">
              <Text className={clsx("font-label-md text-label-md", kyc.tone === "rejected" ? "text-error" : "text-primary")}>{kyc.label}</Text>
              <Text className="font-label-sm text-label-sm text-on-surface-variant">{kyc.sublabel}</Text>
            </View>
          </View>
          {kyc.tone !== "pending" && <Icon name="chevron_right" className={kyc.tone === "rejected" ? "text-error" : "text-primary"} />}
        </Pressable>

        <View className="flex-row rounded-2xl bg-surface-container-high p-1">
          <Pressable onPress={() => setTab("sender")} className={clsx("flex-1 items-center rounded-xl py-3", tab === "sender" && "bg-white")}>
            <Text className={clsx("text-label-md", tab === "sender" ? "font-bold text-primary" : "text-on-surface-variant")}>En tant qu&apos;expéditeur</Text>
          </Pressable>
          <Pressable onPress={() => setTab("traveler")} className={clsx("flex-1 items-center rounded-xl py-3", tab === "traveler" && "bg-white")}>
            <Text className={clsx("text-label-md", tab === "traveler" ? "font-bold text-primary" : "text-on-surface-variant")}>En tant que voyageur</Text>
          </Pressable>
        </View>

        {tab === "traveler" && (
          <View className="gap-8 py-6">
            <View className="overflow-hidden rounded-2xl border-l-4 border-primary bg-white p-6" style={shadows.softGlow}>
              <View className="flex-row items-start justify-between">
                <View>
                  <Text className="text-label-md font-bold uppercase tracking-wider text-on-surface-variant">Mes revenus</Text>
                  <Text className="mt-1 font-headline-lg text-headline-lg text-primary">{formatPrice(totalEarnings)}</Text>
                </View>
                <View className="rounded-2xl bg-primary-container/20 p-3">
                  <Icon name="account_balance_wallet" filled size={28} className="text-primary" />
                </View>
              </View>
            </View>

            <BookingList title="Mes livraisons" bookings={travelerBookings?.bookings ?? []} emptyLabel="Vous n'avez pas encore transporté de colis." />
          </View>
        )}

        {tab === "sender" && (
          <View className="gap-8 py-6">
            <BookingList title="Mes envois" bookings={senderBookings?.bookings ?? []} emptyLabel="Vous n'avez pas encore envoyé de colis." />
          </View>
        )}

        {reviewsData && reviewsData.reviews.length > 0 && (
          <View className="gap-4 pb-4">
            <Text className="font-headline-md text-headline-md text-on-surface">Derniers avis</Text>
            <View className="gap-3">
              {reviewsData.reviews.slice(0, 5).map((review) => (
                <View key={review.id} className="rounded-2xl border border-surface-variant/30 bg-white p-4" style={shadows.softGlow}>
                  <View className="mb-2 flex-row items-center justify-between">
                    <Text className="font-bold text-label-md text-on-background">
                      {review.author.firstName} {review.author.lastName[0]}.
                    </Text>
                    <View className="flex-row">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Icon key={i} name="star" filled={i < review.rating} size={16} className="text-secondary-container" />
                      ))}
                    </View>
                  </View>
                  {review.comment && <Text className="italic text-on-surface-variant">{review.comment}</Text>}
                </View>
              ))}
            </View>
          </View>
        )}

        <View className="mt-8 gap-4">
          <Text className="px-1 font-label-md text-label-md uppercase tracking-widest text-outline">Compte</Text>
          <View className="overflow-hidden rounded-xl bg-white" style={shadows.softGlow}>
            <Link href="/profil/parametres" asChild>
              <Pressable className="flex-row items-center justify-between p-4">
                <View className="flex-row items-center gap-4">
                  <View className="h-10 w-10 items-center justify-center rounded-lg bg-surface">
                    <Icon name="settings" className="text-on-surface-variant" />
                  </View>
                  <Text className="font-body-md text-body-md text-on-background">Confidentialité et compte</Text>
                </View>
                <Icon name="chevron_right" className="text-outline-variant" />
              </Pressable>
            </Link>
            <View className="mx-4 h-px bg-outline-variant/30" />
            <Pressable
              onPress={() => logout.mutate(undefined, { onSuccess: () => router.replace("/connexion") })}
              className="flex-row items-center justify-between p-4"
            >
              <View className="flex-row items-center gap-4">
                <View className="h-10 w-10 items-center justify-center rounded-lg bg-error/10">
                  <Icon name="logout" className="text-error" />
                </View>
                <Text className="font-medium text-error">Déconnexion</Text>
              </View>
            </Pressable>
          </View>
        </View>

        <View className="py-6 opacity-40">
          <Text className="text-center font-label-sm text-label-sm text-on-surface-variant">ColisMonde v1.0.0</Text>
        </View>
      </ScrollView>
    </View>
  );
}

function Stat({ value, label, border }: { value: number; label: string; border?: boolean }) {
  return (
    <View className={clsx("flex-1 items-center", border && "border-x border-outline-variant")}>
      <Text className="font-headline-md text-headline-md text-primary">{value}</Text>
      <Text className="font-label-sm text-label-sm uppercase tracking-wider text-outline">{label}</Text>
    </View>
  );
}

function BookingList({ title, bookings, emptyLabel }: { title: string; bookings: BookingDTO[]; emptyLabel: string }) {
  return (
    <View className="gap-4">
      <Text className="font-headline-md text-headline-md text-on-surface">{title}</Text>
      {bookings.length === 0 && <Text className="font-body-md text-body-md text-on-surface-variant">{emptyLabel}</Text>}
      <View className="gap-4">
        {bookings.slice(0, 5).map((booking) => (
          <Link key={booking.id} href={{ pathname: "/envois/[id]", params: { id: booking.id } }} asChild>
            <Pressable className="gap-4 rounded-2xl bg-white p-5" style={shadows.softGlow}>
              <View className="flex-row items-center justify-between">
                <View className="rounded-full bg-primary/10 px-3 py-1">
                  <Text className="text-[11px] font-bold uppercase tracking-wide text-primary">{CATEGORY_LABELS[booking.request.category]}</Text>
                </View>
                <View className="flex-row items-center gap-1">
                  <Icon name={booking.status === "DELIVERED" ? "check_circle" : "schedule"} size={16} className={booking.status === "DELIVERED" ? "text-primary" : "text-secondary"} />
                  <Text className={clsx("text-label-md font-bold", booking.status === "DELIVERED" ? "text-primary" : "text-secondary")}>
                    {BOOKING_STATUS_LABELS[booking.status]}
                  </Text>
                </View>
              </View>
              <View className="flex-row items-center justify-between">
                <View className="flex-1">
                  <Text className="text-label-sm text-on-surface-variant">Départ</Text>
                  <Text className="font-bold text-body-lg text-on-background">{booking.trip.departureCity.name}</Text>
                </View>
                <Icon name="flight_takeoff" className="text-primary" />
                <View className="flex-1 items-end">
                  <Text className="text-label-sm text-on-surface-variant">Arrivée</Text>
                  <Text className="font-bold text-body-lg text-on-background">{booking.trip.arrivalCity.name}</Text>
                </View>
              </View>
              <View className="flex-row items-center justify-between border-t border-surface-variant pt-4">
                <Text className="text-label-md text-on-surface-variant">{formatDate(booking.createdAt)}</Text>
                <Text className="text-label-md font-bold text-secondary">{formatPrice(booking.agreedPrice)}</Text>
              </View>
            </Pressable>
          </Link>
        ))}
      </View>
    </View>
  );
}
