import request from "supertest";
import { beforeAll, describe, expect, it } from "vitest";
import { createApp } from "@/app";
import { prisma } from "@/lib/prisma";
import { SERVICE_FEE_EUR, PREMIUM_INSURANCE_FEE_EUR } from "@/config/pricing";
import { bearer, createMatchingTripAndRequest, createUser } from "./helpers";

const app = createApp();

type TestUser = Awaited<ReturnType<typeof createUser>>;

describe("cycle de vie complet d'une réservation", () => {
  let sender: TestUser;
  let traveler: TestUser;
  let outsider: TestUser;
  let bookingId: string;
  let paymentId: string;
  let confirmationCode: string;

  beforeAll(async () => {
    [sender, traveler, outsider] = await Promise.all([
      createUser("expediteur"),
      createUser("voyageur"),
      createUser("inconnu"),
    ]);
    const { trip, request: packageRequest } = await createMatchingTripAndRequest(traveler.user.id, sender.user.id);

    const res = await request(app)
      .post("/api/bookings")
      .set(bearer(sender.token))
      .send({ tripId: trip.id, requestId: packageRequest.id, insuranceTier: "PREMIUM" });
    expect(res.status).toBe(201);
    bookingId = res.body.booking.id;
  });

  it("calcule le prix : 5 kg à 8,50 €/kg + frais de service + assurance premium", async () => {
    const res = await request(app).get(`/api/bookings/${bookingId}`).set(bearer(sender.token));
    expect(res.body.booking.status).toBe("PENDING");
    expect(res.body.booking.agreedPrice).toBe(42.5);
    expect(res.body.booking.totalPrice).toBe(42.5 + SERVICE_FEE_EUR + PREMIUM_INSURANCE_FEE_EUR);
  });

  it("un utilisateur extérieur ne peut pas voir la réservation", async () => {
    const res = await request(app).get(`/api/bookings/${bookingId}`).set(bearer(outsider.token));
    expect(res.status).toBe(403);
  });

  it("l'expéditeur ne peut pas accepter sa propre proposition", async () => {
    const res = await request(app).patch(`/api/bookings/${bookingId}/accept`).set(bearer(sender.token));
    expect(res.status).toBe(403);
  });

  it("le voyageur accepte : la demande est réservée et une conversation est ouverte", async () => {
    const res = await request(app).patch(`/api/bookings/${bookingId}/accept`).set(bearer(traveler.token));
    expect(res.status).toBe(200);
    expect(res.body.booking.status).toBe("ACCEPTED");

    const booking = await prisma.booking.findUniqueOrThrow({
      where: { id: bookingId },
      include: { request: true, conversation: true },
    });
    expect(booking.request.status).toBe("MATCHED");
    expect(booking.conversation).not.toBeNull();
  });

  it("seul l'expéditeur voit le code de livraison à 6 chiffres", async () => {
    const asSender = await request(app).get(`/api/bookings/${bookingId}`).set(bearer(sender.token));
    const asTraveler = await request(app).get(`/api/bookings/${bookingId}`).set(bearer(traveler.token));

    expect(asSender.body.booking.confirmationCode).toMatch(/^\d{6}$/);
    expect(asTraveler.body.booking.confirmationCode).toBeNull();
    confirmationCode = asSender.body.booking.confirmationCode;
  });

  it("le voyageur ne peut pas récupérer le colis avant le paiement", async () => {
    const res = await request(app).patch(`/api/bookings/${bookingId}/pickup`).set(bearer(traveler.token)).send({});
    expect(res.status).toBe(409);
  });

  it("seul l'expéditeur peut payer", async () => {
    const res = await request(app).post(`/api/payments/bookings/${bookingId}/payment`).set(bearer(traveler.token));
    expect(res.status).toBe(403);
  });

  it("le paiement porte sur le montant total affiché, frais et assurance compris", async () => {
    const booking = await request(app).get(`/api/bookings/${bookingId}`).set(bearer(sender.token));
    const res = await request(app).post(`/api/payments/bookings/${bookingId}/payment`).set(bearer(sender.token));

    expect(res.status).toBe(201);
    expect(res.body.payment.amount).toBe(booking.body.booking.totalPrice);
    paymentId = res.body.payment.id;
  });

  it("l'expéditeur confirme le paiement", async () => {
    const res = await request(app).post(`/api/payments/${paymentId}/confirm`).set(bearer(sender.token));
    expect(res.status).toBe(200);
    expect(res.body.payment.status).toBe("PAID");
  });

  it("le colis ne peut pas passer en transit avant d'avoir été récupéré", async () => {
    const res = await request(app).patch(`/api/bookings/${bookingId}/in-transit`).set(bearer(traveler.token)).send({});
    expect(res.status).toBe(409);
  });

  it("seul le voyageur peut déclarer la récupération du colis", async () => {
    const res = await request(app).patch(`/api/bookings/${bookingId}/pickup`).set(bearer(sender.token)).send({});
    expect(res.status).toBe(403);
  });

  it("le voyageur récupère le colis puis le met en transit", async () => {
    const pickup = await request(app)
      .patch(`/api/bookings/${bookingId}/pickup`)
      .set(bearer(traveler.token))
      .send({ location: "Paris CDG" });
    expect(pickup.status).toBe(200);
    expect(pickup.body.booking.status).toBe("PICKED_UP");

    const transit = await request(app).patch(`/api/bookings/${bookingId}/in-transit`).set(bearer(traveler.token)).send({});
    expect(transit.status).toBe(200);
    expect(transit.body.booking.status).toBe("IN_TRANSIT");
  });

  it("la livraison est refusée avec un mauvais code", async () => {
    const wrongCode = ((Number(confirmationCode) + 1) % 1_000_000).toString().padStart(6, "0");
    const res = await request(app)
      .patch(`/api/bookings/${bookingId}/deliver`)
      .set(bearer(traveler.token))
      .send({ confirmationCode: wrongCode });
    expect(res.status).toBe(400);
  });

  it("la livraison est confirmée avec le bon code", async () => {
    const res = await request(app)
      .patch(`/api/bookings/${bookingId}/deliver`)
      .set(bearer(traveler.token))
      .send({ confirmationCode });
    expect(res.status).toBe(200);
    expect(res.body.booking.status).toBe("DELIVERED");
  });

  it("une réservation livrée ne peut plus être annulée", async () => {
    const res = await request(app).patch(`/api/bookings/${bookingId}/cancel`).set(bearer(sender.token));
    expect(res.status).toBe(409);
  });

  it("le suivi retrace chaque étape dans l'ordre", async () => {
    const res = await request(app).get(`/api/bookings/${bookingId}/tracking`).set(bearer(sender.token));
    expect(res.body.events.map((e: { status: string }) => e.status)).toEqual([
      "ACCEPTED",
      "PICKED_UP",
      "IN_TRANSIT",
      "DELIVERED",
    ]);
  });
});

describe("règles de création d'une réservation", () => {
  it("interdit de réserver son propre trajet", async () => {
    const user = await createUser("solo");
    const { trip, request: packageRequest } = await createMatchingTripAndRequest(user.user.id, user.user.id);

    const res = await request(app)
      .post("/api/bookings")
      .set(bearer(user.token))
      .send({ tripId: trip.id, requestId: packageRequest.id });
    expect(res.status).toBe(400);
  });

  it("refuse un colis plus lourd que la place disponible", async () => {
    const [sender, traveler] = await Promise.all([createUser("lourd-exp"), createUser("lourd-voy")]);
    const { trip, request: packageRequest } = await createMatchingTripAndRequest(traveler.user.id, sender.user.id);
    await prisma.packageRequest.update({ where: { id: packageRequest.id }, data: { weightKg: trip.availableWeightKg + 1 } });

    const res = await request(app)
      .post("/api/bookings")
      .set(bearer(sender.token))
      .send({ tripId: trip.id, requestId: packageRequest.id });
    expect(res.status).toBe(400);
  });

  it("empêche deux réservations en cours pour le même trajet et la même demande", async () => {
    const [sender, traveler] = await Promise.all([createUser("double-exp"), createUser("double-voy")]);
    const { trip, request: packageRequest } = await createMatchingTripAndRequest(traveler.user.id, sender.user.id);
    const body = { tripId: trip.id, requestId: packageRequest.id };

    const first = await request(app).post("/api/bookings").set(bearer(sender.token)).send(body);
    const second = await request(app).post("/api/bookings").set(bearer(sender.token)).send(body);
    expect(first.status).toBe(201);
    expect(second.status).toBe(409);
  });
});
