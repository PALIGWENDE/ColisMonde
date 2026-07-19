import Link from "next/link";
import { Icon } from "@/components/ui/Icon";

export const metadata = { title: "Politique de confidentialité — ColisMonde" };

export default function ConfidentialitePage() {
  return (
    <div className="min-h-screen bg-surface">
      <header className="sticky top-0 z-40 flex items-center gap-3 bg-surface px-container-padding-mobile py-4 shadow-soft-glow">
        <Link href="/" className="text-primary" aria-label="Retour à l'accueil">
          <Icon name="arrow_back" />
        </Link>
        <h1 className="font-headline-md text-headline-md font-bold text-primary">Politique de confidentialité</h1>
      </header>

      <main className="mx-auto max-w-2xl space-y-8 px-container-padding-mobile py-8 font-body-md text-body-md text-on-surface-variant">
        <p className="font-label-sm text-label-sm text-outline">Dernière mise à jour : {new Date().toLocaleDateString("fr-FR")}</p>

        <section className="space-y-2">
          <h2 className="font-headline-md text-headline-md text-on-background">1. Qui sommes-nous</h2>
          <p>
            ColisMonde est une plateforme de mise en relation entre expéditeurs de colis et voyageurs
            (« crowdshipping »). Ce document décrit les données personnelles que nous collectons, pourquoi, et
            comment vous pouvez y accéder ou les supprimer.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-headline-md text-headline-md text-on-background">2. Données collectées</h2>
          <ul className="list-disc space-y-1 pl-5">
            <li><strong>Identité et contact :</strong> prénom, nom, e-mail, téléphone (optionnel).</li>
            <li><strong>Localisation :</strong> ville et pays renseignés sur votre profil, villes de départ/arrivée de vos trajets et demandes.</li>
            <li><strong>Vérification d&apos;identité :</strong> pièce d&apos;identité (carte d&apos;identité, passeport ou permis) si vous choisissez de faire vérifier votre profil.</li>
            <li><strong>Photos :</strong> photo de profil, photo de preuve de livraison.</li>
            <li><strong>Paiement :</strong> les montants des transactions sont enregistrés ; aucune donnée de carte bancaire n&apos;est stockée par nos soins (traitée par notre prestataire de paiement).</li>
            <li><strong>Contenu échangé :</strong> messages entre expéditeurs et voyageurs, avis publiés.</li>
            <li><strong>Données techniques :</strong> adresse IP et identifiant de session, à des fins de sécurité (limitation des tentatives de connexion abusives).</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="font-headline-md text-headline-md text-on-background">3. Utilisation des données</h2>
          <p>
            Vos données servent exclusivement à faire fonctionner le service : mettre en relation expéditeurs et
            voyageurs, sécuriser les paiements et les livraisons, permettre la messagerie, et prévenir la fraude ou
            les abus. Nous ne vendons aucune donnée personnelle à des tiers.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-headline-md text-headline-md text-on-background">4. Visibilité de vos informations</h2>
          <p>
            Votre e-mail et votre téléphone ne sont <strong>jamais</strong> visibles publiquement ni des autres
            utilisateurs avant qu&apos;une mise en relation soit mutuellement acceptée. Votre prénom, votre note et
            votre ville restent visibles sur les annonces publiques.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-headline-md text-headline-md text-on-background">5. Vos droits</h2>
          <p>
            Vous pouvez à tout moment consulter et modifier vos informations depuis votre profil, ou{" "}
            <strong>supprimer définitivement votre compte</strong> — voir{" "}
            <Link href="/suppression-compte" className="text-primary hover:underline">
              la page dédiée
            </Link>
            . La suppression anonymise vos données personnelles ; les enregistrements liés à des transactions déjà
            effectuées sont conservés sous forme anonymisée, pour des raisons de traçabilité vis-à-vis des autres
            utilisateurs concernés.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-headline-md text-headline-md text-on-background">6. Contact</h2>
          <p>
            Pour toute question relative à vos données personnelles, contactez-nous à{" "}
            <a href="mailto:privacy@colismonde.app" className="text-primary hover:underline">
              privacy@colismonde.app
            </a>
            .
          </p>
        </section>
      </main>
    </div>
  );
}
