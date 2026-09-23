import type { BookingStatus, ItemSize, PackageCategory, TransportMode } from "@colismonde/shared";

export function formatPrice(amount: number): string {
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(amount);
}

export function formatDate(iso: string): string {
  return new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short", year: "numeric" }).format(new Date(iso));
}

export function formatDateTime(iso: string): string {
  return new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }).format(
    new Date(iso),
  );
}

export function formatTime(iso: string): string {
  return new Intl.DateTimeFormat("fr-FR", { hour: "2-digit", minute: "2-digit" }).format(new Date(iso));
}

export function initials(firstName: string, lastName: string): string {
  return `${firstName[0] ?? ""}${lastName[0] ?? ""}`.toUpperCase();
}

export const CATEGORY_LABELS: Record<PackageCategory, string> = {
  DOCUMENTS: "Documents",
  ELECTRONICS: "Électronique",
  CLOTHING: "Vêtements",
  FOOD: "Alimentaire",
  COSMETICS: "Cosmétiques",
  BOOKS: "Livres",
  OTHER: "Autre",
};

export const ITEM_SIZE_LABELS: Record<ItemSize, string> = {
  SMALL: "Petit",
  MEDIUM: "Moyen",
  LARGE: "Grand",
};

export const TRANSPORT_MODE_LABELS: Record<TransportMode, string> = {
  PLANE: "Avion",
  TRAIN: "Train",
  CAR: "Voiture",
  BUS: "Bus",
  BOAT: "Bateau",
  OTHER: "Autre",
};

export const TRANSPORT_MODE_ICONS: Record<TransportMode, string> = {
  PLANE: "flight",
  TRAIN: "train",
  CAR: "directions_car",
  BUS: "directions_bus",
  BOAT: "directions_boat",
  OTHER: "luggage",
};

export const BOOKING_STATUS_LABELS: Record<BookingStatus, string> = {
  PENDING: "En attente",
  ACCEPTED: "Accepté",
  REJECTED: "Refusé",
  PICKED_UP: "Colis remis",
  IN_TRANSIT: "En transit",
  DELIVERED: "Livré",
  CANCELLED: "Annulé",
  DISPUTED: "En litige",
};
