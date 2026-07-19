import type {
  Booking,
  City,
  PackageRequest,
  Payment,
  Review,
  TrackingEvent,
  Trip,
  User,
} from "@prisma/client";

/**
 * Toute la logique de masquage des données personnelles (email/téléphone) vit ici,
 * dans un seul endroit auditable, plutôt que dispersée dans chaque route.
 * Règle : email/téléphone ne sont jamais renvoyés via serializePublicUser.
 */
export function serializePublicUser(user: User) {
  return {
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    avatarUrl: user.avatarUrl,
    bio: user.bio,
    city: user.city,
    country: user.country,
    isVerified: user.isVerified,
    ratingAvg: user.ratingAvg,
    ratingCount: user.ratingCount,
    createdAt: user.createdAt.toISOString(),
  };
}

export function serializeMe(user: User) {
  return {
    ...serializePublicUser(user),
    email: user.email,
    phone: user.phone,
    isAdmin: user.isAdmin,
  };
}

/** N'exposer le contact privé que lorsque le lien est explicitement autorisé (booking accepté). */
export function serializePrivateContact(user: User) {
  return {
    email: user.email,
    phone: user.phone,
  };
}

export function serializeCity(city: City) {
  return {
    id: city.id,
    name: city.name,
    country: city.country,
    countryCode: city.countryCode,
    lat: city.lat,
    lng: city.lng,
  };
}

export function serializeTrip(trip: Trip & { traveler: User; departureCity: City; arrivalCity: City }) {
  return {
    id: trip.id,
    traveler: serializePublicUser(trip.traveler),
    departureCity: serializeCity(trip.departureCity),
    arrivalCity: serializeCity(trip.arrivalCity),
    departureDate: trip.departureDate.toISOString(),
    arrivalDate: trip.arrivalDate?.toISOString() ?? null,
    availableWeightKg: trip.availableWeightKg,
    pricePerKg: trip.pricePerKg,
    acceptedCategories: trip.acceptedCategories,
    maxItemSize: trip.maxItemSize,
    transportMode: trip.transportMode,
    notes: trip.notes,
    status: trip.status,
    createdAt: trip.createdAt.toISOString(),
  };
}

export function serializeRequest(
  request: PackageRequest & { sender: User; departureCity: City; arrivalCity: City },
) {
  return {
    id: request.id,
    sender: serializePublicUser(request.sender),
    departureCity: serializeCity(request.departureCity),
    arrivalCity: serializeCity(request.arrivalCity),
    desiredDate: request.desiredDate.toISOString(),
    weightKg: request.weightKg,
    category: request.category,
    description: request.description,
    sizeEstimate: request.sizeEstimate,
    isUrgent: request.isUrgent,
    offeredPrice: request.offeredPrice,
    status: request.status,
    createdAt: request.createdAt.toISOString(),
  };
}

type FullBooking = Booking & {
  trip: Trip & { traveler: User; departureCity: City; arrivalCity: City };
  request: PackageRequest & { sender: User; departureCity: City; arrivalCity: City };
  sender: User;
  traveler: User;
};

/** currentUserId sert à déterminer si le contact de la contrepartie doit être révélé. */
export function serializeBooking(booking: FullBooking, currentUserId: string) {
  const isParticipant = booking.senderId === currentUserId || booking.travelerId === currentUserId;
  const contactUnlocked = isParticipant && booking.status !== "PENDING" && booking.status !== "REJECTED" && booking.status !== "CANCELLED";

  let counterpartContact = null;
  if (contactUnlocked) {
    const counterpart = booking.senderId === currentUserId ? booking.traveler : booking.sender;
    counterpartContact = serializePrivateContact(counterpart);
  }

  return {
    id: booking.id,
    trip: serializeTrip(booking.trip),
    request: serializeRequest(booking.request),
    sender: serializePublicUser(booking.sender),
    traveler: serializePublicUser(booking.traveler),
    initiatorId: booking.initiatorId,
    status: booking.status,
    agreedPrice: booking.agreedPrice,
    insuranceTier: booking.insuranceTier,
    insuranceFee: booking.insuranceFee,
    serviceFee: booking.serviceFee,
    totalPrice: booking.agreedPrice + booking.insuranceFee + booking.serviceFee,
    confirmationCode: booking.senderId === currentUserId ? booking.confirmationCode : null,
    proofPhotoUrl: booking.proofPhotoUrl,
    createdAt: booking.createdAt.toISOString(),
    counterpartContact,
  };
}

export function serializeTrackingEvent(event: TrackingEvent) {
  return {
    id: event.id,
    status: event.status,
    label: event.label,
    description: event.description,
    location: event.location,
    occurredAt: event.occurredAt.toISOString(),
  };
}

export function serializePayment(payment: Payment) {
  return {
    id: payment.id,
    bookingId: payment.bookingId,
    amount: payment.amount,
    shippingFee: payment.shippingFee,
    serviceFee: payment.serviceFee,
    insuranceFee: payment.insuranceFee,
    currency: payment.currency,
    status: payment.status,
    provider: payment.provider,
    paidAt: payment.paidAt?.toISOString() ?? null,
    createdAt: payment.createdAt.toISOString(),
  };
}

export function serializeReview(review: Review & { author: User }) {
  return {
    id: review.id,
    bookingId: review.bookingId,
    author: serializePublicUser(review.author),
    rating: review.rating,
    comment: review.comment,
    createdAt: review.createdAt.toISOString(),
  };
}
