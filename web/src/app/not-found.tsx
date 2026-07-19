import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-surface px-container-padding-mobile text-center">
      <h1 className="font-headline-lg-mobile text-headline-lg-mobile text-on-background">Page introuvable</h1>
      <p className="font-body-md text-body-md text-on-surface-variant">
        La page que vous cherchez n&apos;existe pas ou a été déplacée.
      </p>
      <Link href="/" className="font-label-md text-label-md text-primary hover:underline">
        Retour à l&apos;accueil
      </Link>
    </main>
  );
}
