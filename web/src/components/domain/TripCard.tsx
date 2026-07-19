import Link from "next/link";
import Image from "next/image";
import type { TripDTO } from "@colismonde/shared";
import { Icon } from "@/components/ui/Icon";
import { formatDate, TRANSPORT_MODE_ICONS } from "@/lib/format";

export function TripCard({ trip }: { trip: TripDTO }) {
  return (
    <Link
      href={`/trajets/${trip.id}`}
      className="block rounded-2xl border border-outline-variant/10 bg-surface-container-lowest p-4 shadow-soft-glow transition-transform active:scale-[0.98]"
    >
      <div className="mb-4 flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 overflow-hidden rounded-full border-2 border-primary-container/20 bg-surface-container">
            {trip.traveler.avatarUrl ? (
              <Image src={trip.traveler.avatarUrl} alt={trip.traveler.firstName} width={48} height={48} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center font-label-md text-label-md text-on-surface-variant">
                {trip.traveler.firstName[0]}
              </div>
            )}
          </div>
          <div>
            <p className="font-headline-md text-base leading-tight">
              {trip.traveler.firstName} {trip.traveler.lastName[0]}.
            </p>
            <div className="flex items-center gap-1 text-secondary">
              <Icon name="star" filled size={16} />
              <span className="font-label-sm text-label-sm">{trip.traveler.ratingAvg.toFixed(1)}</span>
            </div>
          </div>
        </div>
        <div className="rounded-full bg-secondary-container/20 px-3 py-1 font-label-sm text-label-sm text-secondary">
          {trip.pricePerKg}€/kg
        </div>
      </div>

      <div className="mb-4 flex items-center justify-between gap-4">
        <div className="text-left">
          <p className="text-[10px] font-bold uppercase tracking-wider text-outline">{trip.departureCity.name}</p>
          <p className="font-headline-md text-sm">{trip.departureCity.countryCode}</p>
        </div>
        <div className="relative flex flex-1 items-center justify-center px-2">
          <div className="flight-path" />
          <Icon name={TRANSPORT_MODE_ICONS[trip.transportMode]} className="absolute bg-surface-container-lowest px-1 text-primary" />
        </div>
        <div className="text-right">
          <p className="text-[10px] font-bold uppercase tracking-wider text-outline">{trip.arrivalCity.name}</p>
          <p className="font-headline-md text-sm">{trip.arrivalCity.countryCode}</p>
        </div>
      </div>

      <div className="flex items-center justify-between border-t border-outline-variant/10 pt-3">
        <div className="flex items-center gap-2 font-label-sm text-label-sm text-on-surface-variant">
          <Icon name="calendar_month" size={20} />
          <span>{formatDate(trip.departureDate)}</span>
        </div>
        <div className="flex items-center gap-2 font-label-md text-label-md text-primary">
          <Icon name="work" size={20} />
          <span>{trip.availableWeightKg}kg dispos</span>
        </div>
      </div>
    </Link>
  );
}
