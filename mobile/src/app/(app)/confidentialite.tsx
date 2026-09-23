import { ScrollView, Text, View } from "react-native";
import { TopAppBar } from "@/components/layout/TopAppBar";
import { LegalParagraph, LegalSection } from "@/components/domain/LegalSection";

const DATA_ITEMS = [
  { label: "Identité et contact", text: "prénom, nom, e-mail, téléphone (optionnel)." },
  { label: "Localisation", text: "ville et pays renseignés sur votre profil, villes de départ/arrivée de vos trajets et demandes." },
  { label: "Vérification d'identité", text: "pièce d'identité (carte d'identité, passeport ou permis) si vous choisissez de faire vérifier votre profil." },
  { label: "Photos", text: "photo de profil, photo de preuve de livraison." },
  { label: "Paiement", text: "les montants des transactions sont enregistrés ; aucune donnée de carte bancaire n'est stockée par nos soins (traitée par notre prestataire de paiement)." },
  { label: "Contenu échangé", text: "messages entre expéditeurs et voyageurs, avis publiés." },
  { label: "Données techniques", text: "adresse IP et identifiant de session, à des fins de sécurité (limitation des tentatives de connexion abusives)." },
];

export default function ConfidentialiteScreen() {
  return (
    <>
      <TopAppBar title="Politique de confidentialité" showBack />
      <ScrollView className="flex-1 bg-surface" contentContainerClassName="gap-8 px-container-padding-mobile py-8">
        <Text className="font-label-sm text-label-sm text-outline">
          Dernière mise à jour : {new Date().toLocaleDateString("fr-FR")}
        </Text>

        <LegalSection title="1. Qui sommes-nous">
          ColisMonde est une plateforme de mise en relation entre expéditeurs de colis et voyageurs
          (« crowdshipping »). Ce document décrit les données personnelles que nous collectons, pourquoi, et
          comment vous pouvez y accéder ou les supprimer.
        </LegalSection>

        <LegalSection title="2. Données collectées">
          <View className="gap-2">
            {DATA_ITEMS.map((item) => (
              <Text key={item.label} className="font-body-md text-body-md text-on-surface-variant">
                • <Text className="font-semibold text-on-background">{item.label} : </Text>
                {item.text}
              </Text>
            ))}
          </View>
        </LegalSection>

        <LegalSection title="3. Utilisation des données">
          Vos données servent exclusivement à faire fonctionner le service : mettre en relation expéditeurs et
          voyageurs, sécuriser les paiements et les livraisons, permettre la messagerie, et prévenir la fraude ou
          les abus. Nous ne vendons aucune donnée personnelle à des tiers.
        </LegalSection>

        <LegalSection title="4. Visibilité de vos informations">
          <LegalParagraph>
            Votre e-mail et votre téléphone ne sont <Text className="font-semibold text-on-background">jamais</Text> visibles
            publiquement ni des autres utilisateurs avant qu'une mise en relation soit mutuellement acceptée. Votre
            prénom, votre note et votre ville restent visibles sur les annonces publiques.
          </LegalParagraph>
        </LegalSection>

        <LegalSection title="5. Vos droits">
          Vous pouvez à tout moment consulter et modifier vos informations depuis votre profil, ou supprimer
          définitivement votre compte. La suppression anonymise vos données personnelles ; les enregistrements liés
          à des transactions déjà effectuées sont conservés sous forme anonymisée, pour des raisons de traçabilité
          vis-à-vis des autres utilisateurs concernés.
        </LegalSection>

        <LegalSection title="6. Contact">
          Pour toute question relative à vos données personnelles, contactez-nous à privacy@colismonde.app.
        </LegalSection>
      </ScrollView>
    </>
  );
}
