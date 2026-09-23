import { ScrollView, Text } from "react-native";
import { TopAppBar } from "@/components/layout/TopAppBar";
import { LegalParagraph, LegalSection } from "@/components/domain/LegalSection";

export default function ConditionsScreen() {
  return (
    <>
      <TopAppBar title="Conditions générales" showBack />
      <ScrollView className="flex-1 bg-surface" contentContainerClassName="gap-8 px-container-padding-mobile py-8">
        <Text className="font-label-sm text-label-sm text-outline">
          Dernière mise à jour : {new Date().toLocaleDateString("fr-FR")}
        </Text>

        <LegalSection title="1. Objet">
          ColisMonde met en relation des personnes souhaitant expédier un colis (« expéditeurs ») avec des personnes
          voyageant sur le trajet correspondant et acceptant de le transporter (« voyageurs »). ColisMonde n'est ni
          transporteur, ni partie au contrat de transport conclu entre expéditeur et voyageur : la plateforme
          facilite la mise en relation, le paiement et le suivi.
        </LegalSection>

        <LegalSection title="2. Compte utilisateur">
          L'inscription est réservée aux personnes majeures. Vous êtes responsable de l'exactitude des informations
          fournies et de la confidentialité de vos identifiants.
        </LegalSection>

        <LegalSection title="3. Colis autorisés">
          Sont strictement interdits : substances illégales, armes, produits dangereux ou inflammables, espèces,
          biens contrefaits, et plus généralement tout objet dont le transport est interdit par la réglementation
          douanière et de transport applicable aux pays de départ et d'arrivée. L'expéditeur est seul responsable de
          la conformité du contenu de son envoi.
        </LegalSection>

        <LegalSection title="4. Paiement et remboursement">
          Le paiement de l'expéditeur est débloqué au profit du voyageur uniquement après confirmation de la
          livraison (saisie du code de confirmation). En cas de litige (colis non livré, endommagé), un signalement
          peut être effectué depuis l'application ; ColisMonde examine chaque signalement au cas par cas.
        </LegalSection>

        <LegalSection title="5. Comportement des utilisateurs">
          Le harcèlement, les propos injurieux et toute tentative de contournement du paiement sécurisé de la
          plateforme sont interdits et peuvent entraîner la suspension du compte. Chaque utilisateur peut signaler
          ou bloquer un autre utilisateur depuis l'application.
        </LegalSection>

        <LegalSection title="6. Résiliation">
          <LegalParagraph>
            Vous pouvez supprimer votre compte à tout moment. ColisMonde peut suspendre un compte en cas de
            violation manifeste des présentes conditions.
          </LegalParagraph>
        </LegalSection>

        <LegalSection title="7. Contact">
          Pour toute question : support@colismonde.app.
        </LegalSection>
      </ScrollView>
    </>
  );
}
