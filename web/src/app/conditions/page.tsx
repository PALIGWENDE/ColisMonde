import Link from "next/link";
import { Icon } from "@/components/ui/Icon";

export const metadata = { title: "Conditions générales — ColisMonde" };

export default function ConditionsPage() {
  return (
    <div className="min-h-screen bg-surface">
      <header className="sticky top-0 z-40 flex items-center gap-3 bg-surface px-container-padding-mobile py-4 shadow-soft-glow">
        <Link href="/" className="text-primary" aria-label="Retour à l'accueil">
          <Icon name="arrow_back" />
        </Link>
        <h1 className="font-headline-md text-headline-md font-bold text-primary">Conditions générales</h1>
      </header>

      <main className="mx-auto max-w-2xl space-y-8 px-container-padding-mobile py-8 font-body-md text-body-md text-on-surface-variant">
        <p className="font-label-sm text-label-sm text-outline">Dernière mise à jour : {new Date().toLocaleDateString("fr-FR")}</p>

        <section className="space-y-2">
          <h2 className="font-headline-md text-headline-md text-on-background">1. Objet</h2>
          <p>
            ColisMonde met en relation des personnes souhaitant expédier un colis (« expéditeurs ») avec des
            personnes voyageant sur le trajet correspondant et acceptant de le transporter (« voyageurs »).
            ColisMonde n&apos;est ni transporteur, ni partie au contrat de transport conclu entre expéditeur et
            voyageur : la plateforme facilite la mise en relation, le paiement et le suivi.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-headline-md text-headline-md text-on-background">2. Compte utilisateur</h2>
          <p>
            L&apos;inscription est réservée aux personnes majeures. Vous êtes responsable de l&apos;exactitude des
            informations fournies et de la confidentialité de vos identifiants.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-headline-md text-headline-md text-on-background">3. Colis autorisés</h2>
          <p>
            Sont strictement interdits : substances illégales, armes, produits dangereux ou inflammables, espèces,
            biens contrefaits, et plus généralement tout objet dont le transport est interdit par la réglementation
            douanière et de transport applicable aux pays de départ et d&apos;arrivée. L&apos;expéditeur est seul
            responsable de la conformité du contenu de son envoi.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-headline-md text-headline-md text-on-background">4. Paiement et remboursement</h2>
          <p>
            Le paiement de l&apos;expéditeur est débloqué au profit du voyageur uniquement après confirmation de la
            livraison (saisie du code de confirmation). En cas de litige (colis non livré, endommagé), un
            signalement peut être effectué depuis l&apos;application ; ColisMonde examine chaque signalement au cas
            par cas.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-headline-md text-headline-md text-on-background">5. Comportement des utilisateurs</h2>
          <p>
            Le harcèlement, les propos injurieux et toute tentative de contournement du paiement sécurisé de la
            plateforme sont interdits et peuvent entraîner la suspension du compte. Chaque utilisateur peut signaler
            ou bloquer un autre utilisateur depuis l&apos;application.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-headline-md text-headline-md text-on-background">6. Résiliation</h2>
          <p>
            Vous pouvez supprimer votre compte à tout moment (voir{" "}
            <Link href="/suppression-compte" className="text-primary hover:underline">
              suppression de compte
            </Link>
            ). ColisMonde peut suspendre un compte en cas de violation manifeste des présentes conditions.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-headline-md text-headline-md text-on-background">7. Contact</h2>
          <p>
            Pour toute question :{" "}
            <a href="mailto:support@colismonde.app" className="text-primary hover:underline">
              support@colismonde.app
            </a>
            .
          </p>
        </section>
      </main>
    </div>
  );
}
