import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

// Les villes réelles viennent de l'import GeoNames (npm run db:import-cities), qui alimente
// la recherche/autocomplete avec une couverture mondiale. On se contente ici de garantir
// l'existence des quelques villes utilisées par les trajets/demandes de démonstration
// ci-dessous, sans jamais toucher au reste de la table (pas de deleteMany sur City).
const DEMO_CITIES: Array<{ name: string; country: string; countryCode: string; lat: number; lng: number; population: number }> = [
  { name: "Paris", country: "France", countryCode: "FR", lat: 48.8566, lng: 2.3522, population: 2148000 },
  { name: "Lyon", country: "France", countryCode: "FR", lat: 45.764, lng: 4.8357, population: 522000 },
  { name: "Londres", country: "Royaume-Uni", countryCode: "GB", lat: 51.5072, lng: -0.1276, population: 8982000 },
  { name: "Dakar", country: "Sénégal", countryCode: "SN", lat: 14.7167, lng: -17.4677, population: 1146000 },
  { name: "Lagos", country: "Nigeria", countryCode: "NG", lat: 6.5244, lng: 3.3792, population: 14862000 },
  { name: "Tokyo", country: "Japon", countryCode: "JP", lat: 35.6762, lng: 139.6503, population: 37400000 },
  { name: "Séoul", country: "Corée du Sud", countryCode: "KR", lat: 37.5665, lng: 126.978, population: 9776000 },
];

const DEMO_PASSWORD = "Demo1234";

async function main() {
  console.log("🌱 Seed — nettoyage des données existantes...");
  await prisma.$transaction([
    prisma.notification.deleteMany(),
    prisma.review.deleteMany(),
    prisma.report.deleteMany(),
    prisma.message.deleteMany(),
    prisma.conversation.deleteMany(),
    prisma.trackingEvent.deleteMany(),
    prisma.payment.deleteMany(),
    prisma.booking.deleteMany(),
    prisma.packageRequest.deleteMany(),
    prisma.trip.deleteMany(),
    prisma.verificationDocument.deleteMany(),
    prisma.refreshToken.deleteMany(),
    prisma.user.deleteMany(),
  ]);

  console.log("🌍 Seed — vérification des villes de démonstration...");
  const cities = await Promise.all(
    DEMO_CITIES.map((data) =>
      prisma.city.upsert({
        where: { name_countryCode: { name: data.name, countryCode: data.countryCode } },
        update: {},
        create: data,
      }),
    ),
  );
  const cityByName = (name: string) => cities.find((c) => c.name === name)!;

  console.log("👥 Seed — création des comptes de démonstration...");
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 12);

  const amadou = await prisma.user.create({
    data: {
      email: "amadou.traveler@example.com",
      passwordHash,
      firstName: "Amadou",
      lastName: "Diallo",
      phone: "+221771234567",
      country: "Sénégal",
      city: "Dakar",
      isVerified: true,
      bio: "Voyageur régulier entre l'Europe et l'Afrique de l'Ouest.",
      ratingAvg: 4.8,
      ratingCount: 124,
    },
  });

  const sophie = await prisma.user.create({
    data: {
      email: "sophie.sender@example.com",
      passwordHash,
      firstName: "Sophie",
      lastName: "Laurent",
      phone: "+33612345678",
      country: "France",
      city: "Lyon",
      isVerified: true,
      bio: "J'envoie régulièrement des colis à ma famille à l'étranger.",
      ratingAvg: 4.9,
      ratingCount: 82,
    },
  });

  const marc = await prisma.user.create({
    data: {
      email: "marc.traveler@example.com",
      passwordHash,
      firstName: "Marc",
      lastName: "Lefèvre",
      phone: "+33698765432",
      country: "France",
      city: "Paris",
      isVerified: true,
      ratingAvg: 4.9,
      ratingCount: 124,
    },
  });

  const admin = await prisma.user.create({
    data: {
      email: "admin@colismonde.app",
      passwordHash,
      firstName: "Admin",
      lastName: "ColisMonde",
      isVerified: true,
      isAdmin: true,
    },
  });

  console.log("✈️  Seed — création des trajets...");
  const tripParisDakar = await prisma.trip.create({
    data: {
      travelerId: amadou.id,
      departureCityId: cityByName("Paris").id,
      arrivalCityId: cityByName("Dakar").id,
      departureDate: new Date(Date.now() + 3 * 86_400_000),
      availableWeightKg: 8,
      pricePerKg: 12,
      acceptedCategories: ["ELECTRONICS", "CLOTHING", "DOCUMENTS", "OTHER"],
      maxItemSize: "MEDIUM",
      transportMode: "PLANE",
      notes: "Vol direct Air France, bagage en soute disponible.",
    },
  });

  await prisma.trip.create({
    data: {
      travelerId: marc.id,
      departureCityId: cityByName("Tokyo").id,
      arrivalCityId: cityByName("Séoul").id,
      departureDate: new Date(Date.now() + 1 * 86_400_000),
      availableWeightKg: 5,
      pricePerKg: 25,
      acceptedCategories: ["ELECTRONICS", "DOCUMENTS"],
      maxItemSize: "SMALL",
      transportMode: "PLANE",
    },
  });

  console.log("📦 Seed — création des demandes d'envoi...");
  const requestLondonLagos = await prisma.packageRequest.create({
    data: {
      senderId: sophie.id,
      departureCityId: cityByName("Londres").id,
      arrivalCityId: cityByName("Lagos").id,
      desiredDate: new Date(Date.now() + 5 * 86_400_000),
      weightKg: 0.5,
      category: "DOCUMENTS",
      description: "Enveloppe de documents administratifs urgents.",
      sizeEstimate: "SMALL",
      isUrgent: true,
      offeredPrice: 45,
    },
  });

  const requestParisDakar = await prisma.packageRequest.create({
    data: {
      senderId: sophie.id,
      departureCityId: cityByName("Paris").id,
      arrivalCityId: cityByName("Dakar").id,
      desiredDate: new Date(Date.now() + 3 * 86_400_000),
      weightKg: 2.5,
      category: "ELECTRONICS",
      description: "Un smartphone reconditionné, dans sa boîte d'origine.",
      sizeEstimate: "MEDIUM",
      isUrgent: false,
      offeredPrice: 30,
    },
  });

  console.log("🤝 Seed — création d'une réservation acceptée, payée et en transit...");
  const booking = await prisma.booking.create({
    data: {
      tripId: tripParisDakar.id,
      requestId: requestParisDakar.id,
      senderId: sophie.id,
      travelerId: amadou.id,
      initiatorId: sophie.id,
      status: "IN_TRANSIT",
      agreedPrice: 30,
      insuranceTier: "PREMIUM",
      insuranceFee: 15,
      serviceFee: 15,
      confirmationCode: "482930",
    },
  });
  await prisma.packageRequest.update({ where: { id: requestParisDakar.id }, data: { status: "MATCHED" } });

  await prisma.payment.create({
    data: {
      bookingId: booking.id,
      amount: 30,
      shippingFee: 30,
      serviceFee: 15,
      insuranceFee: 15,
      status: "PAID",
      provider: "mock",
      providerRef: "mock_seed_demo",
      paidAt: new Date(Date.now() - 2 * 86_400_000),
    },
  });

  await prisma.trackingEvent.createMany({
    data: [
      {
        bookingId: booking.id,
        status: "ACCEPTED",
        label: "Accepté",
        description: "L'offre a été validée par le voyageur.",
        occurredAt: new Date(Date.now() - 2 * 86_400_000),
      },
      {
        bookingId: booking.id,
        status: "PICKED_UP",
        label: "Colis remis",
        description: "Le colis a été confié au voyageur.",
        location: "Aéroport Paris CDG",
        occurredAt: new Date(Date.now() - 1 * 86_400_000),
      },
      {
        bookingId: booking.id,
        status: "IN_TRANSIT",
        label: "En transit",
        description: "Le colis traverse l'Atlantique vers Dakar.",
        location: "Vol AF718 en cours",
        occurredAt: new Date(),
      },
    ],
  });

  const conversation = await prisma.conversation.create({ data: { bookingId: booking.id } });
  await prisma.message.createMany({
    data: [
      {
        conversationId: conversation.id,
        senderId: amadou.id,
        content: "Bonjour ! J'ai bien reçu la demande. Je décolle demain à 10h de CDG Terminal 2E.",
        createdAt: new Date(Date.now() - 90 * 60_000),
      },
      {
        conversationId: conversation.id,
        senderId: sophie.id,
        content: "Super, merci Amadou ! On se retrouve devant le Paul à l'enregistrement vers 7h30 ?",
        createdAt: new Date(Date.now() - 60 * 60_000),
      },
    ],
  });

  console.log("⭐ Seed — laisser la demande Londres → Lagos ouverte pour démonstration du matching...");
  void requestLondonLagos;

  console.log("✅ Seed terminé.");
  console.log(`   Comptes de démonstration (mot de passe commun : "${DEMO_PASSWORD}") :`);
  console.log(`   - ${sophie.email} (expéditrice)`);
  console.log(`   - ${amadou.email} (voyageur)`);
  console.log(`   - ${marc.email} (voyageur)`);
  console.log(`   - ${admin.email} (admin)`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
