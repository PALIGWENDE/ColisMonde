/** @type {import('next').NextConfig} */
const nextConfig = {
  // three/@react-three doivent être transpilés par Next (et non traités comme externes déjà
  // buildés) pour éviter les conflits d'instance React entre le bundle principal et le chunk
  // async du globe 3D (cf. erreur "ReactCurrentOwner" sinon).
  transpilePackages: ["@colismonde/shared", "three", "@react-three/fiber", "@react-three/drei"],
  images: {
    remotePatterns: [
      { protocol: "http", hostname: "localhost" },
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
      { protocol: "https", hostname: "*.onrender.com" },
    ],
  },
  async rewrites() {
    // INTERNAL_API_URL (sans préfixe NEXT_PUBLIC_, donc jamais exposée au bundle client) désigne
    // où le serveur Next.js doit réellement joindre l'API — toujours en local, même quand la page
    // est servie publiquement via un tunnel. Le navigateur, lui, n'appelle jamais que l'origine de
    // la page elle-même (/api/..., /uploads/...) : ça évite tout souci de CORS et de cookies
    // cross-site quand l'app est exposée derrière une URL publique temporaire (tunnel de test).
    const internalApiUrl = process.env.INTERNAL_API_URL ?? "http://localhost:4000";
    return [
      {
        source: "/api/:path*",
        destination: `${internalApiUrl}/api/:path*`,
      },
      {
        source: "/uploads/:path*",
        destination: `${internalApiUrl}/uploads/:path*`,
      },
    ];
  },
};

module.exports = nextConfig;
