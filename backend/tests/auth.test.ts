import request from "supertest";
import { beforeAll, describe, expect, it } from "vitest";
import { createApp } from "@/app";
import { prisma } from "@/lib/prisma";
import { uniqueEmail } from "./helpers";

const app = createApp();
const PASSWORD = "MotDePasse123";

function setRefreshCookieHeader(res: request.Response) {
  const cookies = ([] as string[]).concat(res.headers["set-cookie"] ?? []);
  return cookies.find((c) => c.startsWith("cm_refresh="));
}

/** Ne garde que "cm_refresh=<valeur>", comme le renverrait un navigateur. */
function refreshCookieFrom(res: request.Response) {
  return setRefreshCookieHeader(res)?.split(";")[0];
}

describe("inscription", () => {
  const email = uniqueEmail("inscription");

  it("crée le compte, ouvre une session et ne stocke jamais le mot de passe en clair", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({ email, password: PASSWORD, firstName: "Awa", lastName: "Ouédraogo" });

    expect(res.status).toBe(201);
    expect(res.body.accessToken).toEqual(expect.any(String));
    expect(res.body.user.email).toBe(email);
    expect(res.body.refreshToken).toBeUndefined();
    expect(setRefreshCookieHeader(res)).toMatch(/HttpOnly/i);

    const stored = await prisma.user.findUniqueOrThrow({ where: { email } });
    expect(stored.passwordHash).not.toBe(PASSWORD);
    expect(stored.passwordHash).toMatch(/^\$2[aby]\$/);
  });

  it("refuse un deuxième compte avec le même e-mail", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({ email, password: PASSWORD, firstName: "Awa", lastName: "Bis" });
    expect(res.status).toBe(409);
  });

  it("refuse un mot de passe trop faible", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({ email: uniqueEmail("faible"), password: "abc", firstName: "A", lastName: "B" });
    expect(res.status).toBe(400);
  });
});

describe("connexion et session", () => {
  const email = uniqueEmail("connexion");

  beforeAll(async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({ email, password: PASSWORD, firstName: "Ibrahim", lastName: "Sawadogo" });
    expect(res.status).toBe(201);
  });

  it("donne la même réponse pour un mauvais mot de passe et un e-mail inconnu", async () => {
    const wrongPassword = await request(app).post("/api/auth/login").send({ email, password: "Mauvais123" });
    const unknownEmail = await request(app)
      .post("/api/auth/login")
      .send({ email: uniqueEmail("inconnu"), password: PASSWORD });

    expect(wrongPassword.status).toBe(401);
    expect(unknownEmail.status).toBe(401);
    expect(wrongPassword.body.message).toBe(unknownEmail.body.message);
  });

  it("refuse l'accès aux routes protégées sans jeton", async () => {
    const res = await request(app).get("/api/auth/me");
    expect(res.status).toBe(401);
  });

  it("connecte l'utilisateur et le jeton donne accès à son profil", async () => {
    const login = await request(app).post("/api/auth/login").send({ email, password: PASSWORD });
    expect(login.status).toBe(200);

    const me = await request(app).get("/api/auth/me").set("Authorization", `Bearer ${login.body.accessToken}`);
    expect(me.status).toBe(200);
    expect(me.body.user.email).toBe(email);
  });

  it("renouvelle la session par cookie et rejette la réutilisation d'un ancien cookie", async () => {
    const login = await request(app).post("/api/auth/login").send({ email, password: PASSWORD });
    const firstCookie = refreshCookieFrom(login)!;

    const refreshed = await request(app).post("/api/auth/refresh").set("Cookie", firstCookie);
    expect(refreshed.status).toBe(200);
    expect(refreshed.body.accessToken).toEqual(expect.any(String));

    const replay = await request(app).post("/api/auth/refresh").set("Cookie", firstCookie);
    expect(replay.status).toBe(401);
  });

  it("la déconnexion invalide la session", async () => {
    const login = await request(app).post("/api/auth/login").send({ email, password: PASSWORD });
    const cookie = refreshCookieFrom(login)!;

    const logout = await request(app).post("/api/auth/logout").set("Cookie", cookie);
    expect(logout.status).toBe(204);

    const refresh = await request(app).post("/api/auth/refresh").set("Cookie", cookie);
    expect(refresh.status).toBe(401);
  });

  it("l'application mobile reçoit le jeton de renouvellement dans la réponse et peut s'en servir", async () => {
    const login = await request(app)
      .post("/api/auth/login")
      .set("X-Client-Type", "mobile")
      .send({ email, password: PASSWORD });
    expect(login.status).toBe(200);
    expect(login.body.refreshToken).toEqual(expect.any(String));

    const refresh = await request(app)
      .post("/api/auth/refresh")
      .set("X-Client-Type", "mobile")
      .send({ refreshToken: login.body.refreshToken });
    expect(refresh.status).toBe(200);
    expect(refresh.body.refreshToken).toEqual(expect.any(String));
    expect(refresh.body.refreshToken).not.toBe(login.body.refreshToken);
  });
});
