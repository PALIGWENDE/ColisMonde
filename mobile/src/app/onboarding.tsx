import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import clsx from "clsx";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { shadows } from "@/theme/shadows";

const STEPS = [
  {
    icon: "public",
    iconBg: "bg-primary-container",
    title: "Envoyez ou transportez, partout dans le monde",
    description:
      "Indiquez où vous allez ou ce que vous voulez envoyer. ColisMonde met en relation expéditeurs et voyageurs selon leurs trajets.",
  },
  {
    icon: "verified_user",
    iconBg: "bg-secondary",
    title: "Un profil vérifié pour voyager en confiance",
    description:
      "Ajoutez une pièce d'identité pour obtenir le badge « Vérifié » : cela rassure vos futurs partenaires d'échange et débloque tous les trajets.",
  },
  {
    icon: "notifications_active",
    iconBg: "bg-tertiary",
    title: "Restez informé à chaque étape",
    description:
      "Recevez une notification dès qu'une demande correspond à votre trajet, qu'un message arrive ou que votre colis change de statut.",
  },
] as const;

export default function OnboardingScreen() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const isLast = step === STEPS.length - 1;
  const current = STEPS[step];

  const finish = () => router.replace("/accueil");

  return (
    <SafeAreaView className="flex-1 bg-surface px-container-padding-mobile py-10">
      <View className="items-end">
        <Pressable onPress={finish}>
          <Text className="font-label-md text-label-md text-on-surface-variant">Passer</Text>
        </Pressable>
      </View>

      <View className="flex-1 items-center justify-center gap-8">
        <View className={clsx("h-24 w-24 items-center justify-center rounded-full", current.iconBg)} style={shadows.elevated}>
          <Icon name={current.icon} size={48} className="text-white" />
        </View>
        <View className="max-w-sm gap-3">
          <Text className="text-center font-headline-lg-mobile text-headline-lg-mobile text-on-background">{current.title}</Text>
          <Text className="text-center font-body-md text-body-md text-on-surface-variant">{current.description}</Text>
        </View>
      </View>

      <View className="gap-6">
        <View className="flex-row justify-center gap-2">
          {STEPS.map((_, i) => (
            <View key={i} className={clsx("h-2 rounded-full", i === step ? "w-8 bg-primary-container" : "w-2 bg-outline-variant")} />
          ))}
        </View>

        <Button size="lg" fullWidth onPress={() => (isLast ? finish() : setStep((s) => s + 1))}>
          {isLast ? "Commencer" : "Suivant"}
        </Button>
      </View>
    </SafeAreaView>
  );
}
