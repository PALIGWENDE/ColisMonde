import { useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import clsx from "clsx";
import { Icon } from "@/components/ui/Icon";
import { Button } from "@/components/ui/Button";
import { useCreateReview } from "@/hooks/useReviews";
import { ApiClientError } from "@/lib/apiClient";
import { shadows } from "@/theme/shadows";

export function ReviewForm({ bookingId, targetName }: { bookingId: string; targetName: string }) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const createReview = useCreateReview(bookingId);

  if (done) {
    return (
      <View className="rounded-xl bg-primary-container/10 p-4">
        <Text className="text-center font-body-md text-body-md text-primary">Merci pour votre avis !</Text>
      </View>
    );
  }

  const submit = async () => {
    setError(null);
    try {
      await createReview.mutateAsync({ rating, comment: comment || undefined });
      setDone(true);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Une erreur est survenue");
    }
  };

  return (
    <View className="gap-4 rounded-xl bg-surface-container-lowest p-5" style={shadows.softGlow}>
      <Text className="font-headline-md text-headline-md text-on-surface">Évaluer {targetName}</Text>
      <View className="flex-row justify-center gap-2">
        {[1, 2, 3, 4, 5].map((value) => (
          <Pressable key={value} onPress={() => setRating(value)} accessibilityLabel={`${value} étoiles`}>
            <Icon name="star" filled={value <= rating} className={clsx(value <= rating ? "text-secondary" : "text-outline-variant")} size={32} />
          </Pressable>
        ))}
      </View>
      <TextInput
        multiline
        numberOfLines={3}
        value={comment}
        onChangeText={setComment}
        placeholder="Partagez votre expérience (optionnel)"
        placeholderTextColor="#6f797a"
        className="rounded-xl border border-outline-variant/40 bg-surface p-3 font-body-md text-body-md text-on-surface"
        style={{ textAlignVertical: "top", minHeight: 72 }}
      />
      {error && (
        <View className="rounded-xl bg-error-container px-4 py-3">
          <Text className="font-label-md text-label-md text-on-error-container">{error}</Text>
        </View>
      )}
      <Button fullWidth loading={createReview.isPending} onPress={submit}>
        Envoyer mon avis
      </Button>
    </View>
  );
}
