import Link from "next/link";
import type { PackageRequestDTO } from "@colismonde/shared";
import { CATEGORY_LABELS, formatPrice } from "@/lib/format";

export function RequestCard({ request }: { request: PackageRequestDTO }) {
  return (
    <Link
      href={`/recherche?arrivalCityId=${request.arrivalCity.id}&departureCityId=${request.departureCity.id}`}
      className="block rounded-2xl border border-outline-variant/10 bg-surface-container-lowest p-4 shadow-soft-glow transition-transform active:scale-[0.98]"
    >
      <div className="flex gap-4">
        <div className="flex h-20 w-20 flex-shrink-0 items-center justify-center rounded-xl bg-primary-container/10 text-primary">
          <span className="font-headline-lg-mobile text-headline-lg-mobile">{request.weightKg}kg</span>
        </div>
        <div className="flex-1">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-headline-md text-base text-on-surface">{CATEGORY_LABELS[request.category]}</h3>
            <span className="text-lg font-bold text-primary">{formatPrice(request.offeredPrice)}</span>
          </div>
          <p className="mt-1 line-clamp-2 font-label-sm text-label-sm text-on-surface-variant">{request.description}</p>
          <div className="mt-2 flex items-center gap-2 font-label-sm text-label-sm text-on-surface-variant">
            <span>
              {request.departureCity.name} → {request.arrivalCity.name}
            </span>
          </div>
        </div>
      </div>
      <div className="mt-4 flex gap-2">
        {request.isUrgent && (
          <span className="rounded-full bg-primary/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-primary">
            Urgent
          </span>
        )}
        <span className="rounded-full bg-surface-container px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-on-surface-variant">
          {CATEGORY_LABELS[request.category]}
        </span>
      </div>
    </Link>
  );
}
