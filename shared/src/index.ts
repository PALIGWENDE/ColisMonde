/**
 * Types et enums partagés entre le backend et le frontend.
 * Les valeurs des unions littérales doivent rester synchronisées avec les enums Prisma
 * définis dans backend/prisma/schema.prisma.
 */

export const TRANSPORT_MODES = ["PLANE", "TRAIN", "CAR", "BUS", "BOAT", "OTHER"] as const;
export type TransportMode = (typeof TRANSPORT_MODES)[number];

export const PACKAGE_CATEGORIES = [
  "DOCUMENTS",
  "ELECTRONICS",
  "CLOTHING",
  "FOOD",
  "COSMETICS",
  "BOOKS",
  "OTHER",
] as const;
export type PackageCategory = (typeof PACKAGE_CATEGORIES)[number];

export const ITEM_SIZES = ["SMALL", "MEDIUM", "LARGE"] as const;
export type ItemSize = (typeof ITEM_SIZES)[number];

export const TRIP_STATUSES = ["ACTIVE", "COMPLETED", "CANCELLED"] as const;
export type TripStatus = (typeof TRIP_STATUSES)[number];

export const REQUEST_STATUSES = ["OPEN", "MATCHED", "CANCELLED"] as const;
export type RequestStatus = (typeof REQUEST_STATUSES)[number];

export const BOOKING_STATUSES = [
  "PENDING",
  "ACCEPTED",
  "REJECTED",
  "PICKED_UP",
  "IN_TRANSIT",
  "DELIVERED",
  "CANCELLED",
  "DISPUTED",
] as const;
export type BookingStatus = (typeof BOOKING_STATUSES)[number];

export const INSURANCE_TIERS = ["BASIC", "PREMIUM"] as const;
export type InsuranceTier = (typeof INSURANCE_TIERS)[number];

export const PAYMENT_STATUSES = ["PENDING", "PAID", "REFUNDED", "FAILED"] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

export const DOCUMENT_TYPES = ["ID_CARD", "PASSPORT", "DRIVER_LICENSE"] as const;
export type DocumentType = (typeof DOCUMENT_TYPES)[number];

export const DOCUMENT_STATUSES = ["PENDING", "APPROVED", "REJECTED"] as const;
export type DocumentStatus = (typeof DOCUMENT_STATUSES)[number];

export const REPORT_REASONS = [
  "FRAUD",
  "INAPPROPRIATE_BEHAVIOR",
  "ITEM_MISMATCH",
  "NO_SHOW",
  "SAFETY_CONCERN",
  "OTHER",
] as const;
export type ReportReason = (typeof REPORT_REASONS)[number];

export const REPORT_STATUSES = ["PENDING", "REVIEWED", "RESOLVED"] as const;
export type ReportStatus = (typeof REPORT_STATUSES)[number];

export const NOTIFICATION_TYPES = [
  "BOOKING_REQUEST",
  "BOOKING_ACCEPTED",
  "BOOKING_REJECTED",
  "MESSAGE_RECEIVED",
  "PACKAGE_PICKED_UP",
  "PACKAGE_IN_TRANSIT",
  "PACKAGE_DELIVERED",
  "PAYMENT_RECEIVED",
  "REVIEW_RECEIVED",
  "DOCUMENT_REVIEWED",
] as const;
export type NotificationType = (typeof NOTIFICATION_TYPES)[number];

// ---------- DTOs partagés (formes des réponses API) ----------

export interface CityDTO {
  id: string;
  name: string;
  country: string;
  countryCode: string;
  lat: number;
  lng: number;
}

export interface PublicUserDTO {
  id: string;
  firstName: string;
  lastName: string;
  avatarUrl: string | null;
  city: string | null;
  country: string | null;
  isVerified: boolean;
  ratingAvg: number;
  ratingCount: number;
  createdAt: string;
}

/** Visible uniquement une fois le Booking ACCEPTED — cf. règle IDOR/PII du backend. */
export interface PrivateContactDTO {
  email: string;
  phone: string | null;
}

export interface TripDTO {
  id: string;
  traveler: PublicUserDTO;
  departureCity: CityDTO;
  arrivalCity: CityDTO;
  departureDate: string;
  arrivalDate: string | null;
  availableWeightKg: number;
  pricePerKg: number;
  acceptedCategories: PackageCategory[];
  maxItemSize: ItemSize;
  transportMode: TransportMode;
  notes: string | null;
  status: TripStatus;
  createdAt: string;
}

export interface PackageRequestDTO {
  id: string;
  sender: PublicUserDTO;
  departureCity: CityDTO;
  arrivalCity: CityDTO;
  desiredDate: string;
  weightKg: number;
  category: PackageCategory;
  description: string;
  sizeEstimate: ItemSize;
  isUrgent: boolean;
  offeredPrice: number;
  status: RequestStatus;
  createdAt: string;
}

export interface BookingDTO {
  id: string;
  trip: TripDTO;
  request: PackageRequestDTO;
  sender: PublicUserDTO;
  traveler: PublicUserDTO;
  initiatorId: string;
  status: BookingStatus;
  agreedPrice: number;
  insuranceTier: InsuranceTier;
  insuranceFee: number;
  serviceFee: number;
  totalPrice: number;
  confirmationCode: string | null;
  proofPhotoUrl: string | null;
  createdAt: string;
  /** Uniquement présent si le booking appartient à l'utilisateur courant. */
  counterpartContact?: PrivateContactDTO | null;
}

export interface TrackingEventDTO {
  id: string;
  status: BookingStatus;
  label: string;
  description: string | null;
  location: string | null;
  occurredAt: string;
}

export interface MessageDTO {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  attachmentUrl: string | null;
  readAt: string | null;
  createdAt: string;
}

export interface ConversationDTO {
  id: string;
  bookingId: string;
  otherParticipant: PublicUserDTO;
  lastMessage: MessageDTO | null;
  unreadCount: number;
}

export interface ReviewDTO {
  id: string;
  bookingId: string;
  author: PublicUserDTO;
  rating: number;
  comment: string | null;
  createdAt: string;
}

export interface AuthTokensDTO {
  accessToken: string;
  accessTokenExpiresAt: string;
  /** Renvoyé uniquement aux clients mobiles (header X-Client-Type: mobile) — le web reçoit son refresh token via cookie httpOnly. */
  refreshToken?: string;
}

export interface ApiErrorBody {
  error: string;
  message: string;
  details?: Record<string, string[]>;
}
