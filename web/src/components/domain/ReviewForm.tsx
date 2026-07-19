"use client";

import { useState } from "react";
import clsx from "clsx";
import { Icon } from "@/components/ui/Icon";
import { Button } from "@/components/ui/Button";
import { useCreateReview } from "@/hooks/useReviews";
import { ApiClientError } from "@/lib/apiClient";

export function ReviewForm({ bookingId, targetName }: { bookingId: string; targetName: string }) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const createReview = useCreateReview(bookingId);

  if (done) {
    return (
      <div className="rounded-xl bg-primary-container/10 p-4 text-center font-body-md text-body-md text-primary">
        Merci pour votre avis !
      </div>
    );
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await createReview.mutateAsync({ rating, comment: comment || undefined });
      setDone(true);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Une erreur est survenue");
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4 rounded-xl bg-surface-container-lowest p-5 shadow-soft-glow">
      <h3 className="font-headline-md text-headline-md text-on-surface">Évaluer {targetName}</h3>
      <div className="flex justify-center gap-2">
        {[1, 2, 3, 4, 5].map((value) => (
          <button type="button" key={value} onClick={() => setRating(value)} aria-label={`${value} étoiles`}>
            <Icon name="star" filled={value <= rating} className={clsx(value <= rating ? "text-secondary" : "text-outline-variant")} size={32} />
          </button>
        ))}
      </div>
      <textarea
        rows={3}
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="Partagez votre expérience (optionnel)"
        className="w-full rounded-xl border border-outline-variant/40 bg-surface p-3 font-body-md text-body-md focus:border-primary-container focus:outline-none"
      />
      {error && <p className="rounded-xl bg-error-container px-4 py-3 font-label-md text-label-md text-on-error-container">{error}</p>}
      <Button type="submit" fullWidth loading={createReview.isPending}>
        Envoyer mon avis
      </Button>
    </form>
  );
}
