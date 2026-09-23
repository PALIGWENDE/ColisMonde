import { Pressable, View } from "react-native";
import { Tabs, useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { Icon } from "@/components/ui/Icon";
import { shadows } from "@/theme/shadows";

/** Miroir de web/src/components/layout/BottomNav.tsx : 4 onglets + FAB central flottant. */
export default function TabsLayout() {
  const router = useRouter();

  return (
    <View className="flex-1">
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: "#046A38",
          tabBarInactiveTintColor: "#3e494a",
          tabBarLabelStyle: { fontSize: 12, fontWeight: "500" },
          tabBarStyle: { height: 60, paddingBottom: 8, paddingTop: 8 },
        }}
      >
        <Tabs.Screen name="accueil" options={{ title: "Accueil", tabBarIcon: ({ color }) => <Icon name="home" color={color} /> }} />
        <Tabs.Screen name="recherche" options={{ title: "Rechercher", tabBarIcon: ({ color }) => <Icon name="search" color={color} /> }} />
        <Tabs.Screen name="messages" options={{ title: "Messages", tabBarIcon: ({ color }) => <Icon name="chat_bubble" color={color} /> }} />
        <Tabs.Screen name="profil" options={{ title: "Profil", tabBarIcon: ({ color }) => <Icon name="person" color={color} /> }} />
      </Tabs>

      <View pointerEvents="box-none" className="absolute bottom-6 w-full items-center">
        <Pressable
          onPress={() => router.push("/annonce/nouvelle")}
          accessibilityLabel="Créer une annonce"
          className="active:scale-90"
          style={shadows.elevated}
        >
          <LinearGradient
            colors={["#EF2B2D", "#009E49"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            className="h-14 w-14 items-center justify-center rounded-full"
          >
            <Icon name="add" size={30} className="text-white" />
          </LinearGradient>
        </Pressable>
      </View>
    </View>
  );
}
