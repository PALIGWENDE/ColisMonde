import type { ComponentProps } from "react";
import { cssInterop } from "nativewind";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";

// Permet `className="text-primary"` sur ces icônes tierces : NativeWind ne les reconnaît pas
// nativement, cssInterop mappe la couleur résolue par Tailwind vers leur prop `color`.
cssInterop(MaterialIcons, { className: { target: "style", nativeStyleToProp: { color: true } } });
cssInterop(MaterialCommunityIcons, { className: { target: "style", nativeStyleToProp: { color: true } } });

type Family = "material" | "community";

/**
 * Le web utilise Material Symbols Outlined (police web CSS, cf. web/src/components/ui/Icon.tsx),
 * qui n'existe pas en React Native. Table de correspondance construite en auditant tous les appels
 * <Icon name="..."> de web/src/** (voir grep exhaustif) vers @expo/vector-icons — Material Symbols
 * classique quand le nom existe tel quel, MaterialCommunityIcons pour les symboles plus récents
 * absents du set Material Icons classique. À vérifier visuellement sur appareil/simulateur (Phase 1 QA).
 */
const ICON_NAME_MAP: Record<string, { family: Family; name: string }> = {
  public: { family: "material", name: "public" },
  package_2: { family: "community", name: "package-variant" },
  travel_explore: { family: "material", name: "explore" },
  verified: { family: "material", name: "verified" },
  verified_user: { family: "material", name: "verified-user" },
  arrow_forward: { family: "material", name: "arrow-forward" },
  arrow_back: { family: "material", name: "arrow-back" },
  star: { family: "material", name: "star" },
  luggage: { family: "community", name: "bag-suitcase" },
  language: { family: "material", name: "language" },
  calendar_month: { family: "community", name: "calendar-month" },
  calendar_add_on: { family: "community", name: "calendar-plus" },
  work: { family: "material", name: "work" },
  add: { family: "material", name: "add" },
  close: { family: "material", name: "close" },
  location_on: { family: "material", name: "location-on" },
  near_me: { family: "material", name: "near-me" },
  notifications: { family: "material", name: "notifications" },
  notifications_active: { family: "material", name: "notifications-active" },
  search: { family: "material", name: "search" },
  chat_bubble: { family: "material", name: "chat-bubble" },
  chat: { family: "material", name: "chat" },
  bolt: { family: "material", name: "bolt" },
  share: { family: "material", name: "share" },
  info: { family: "material", name: "info" },
  done_all: { family: "material", name: "done-all" },
  send: { family: "material", name: "send" },
  flight: { family: "material", name: "flight" },
  flight_takeoff: { family: "material", name: "flight-takeoff" },
  mail: { family: "material", name: "mail" },
  call: { family: "material", name: "call" },
  block: { family: "material", name: "block" },
  lock: { family: "material", name: "lock" },
  local_shipping: { family: "material", name: "local-shipping" },
  check: { family: "material", name: "check" },
  check_circle: { family: "material", name: "check-circle" },
  shield: { family: "community", name: "shield" },
  inventory_2: { family: "community", name: "package-variant-closed" },
  photo_camera: { family: "material", name: "photo-camera" },
  credit_card: { family: "material", name: "credit-card" },
  chevron_right: { family: "material", name: "chevron-right" },
  account_balance_wallet: { family: "material", name: "account-balance-wallet" },
  settings: { family: "material", name: "settings" },
  logout: { family: "material", name: "logout" },
  home: { family: "material", name: "home" },
  person: { family: "material", name: "person" },
  eco: { family: "material", name: "eco" },
  security: { family: "material", name: "security" },
  savings: { family: "community", name: "piggy-bank" },
  train: { family: "material", name: "train" },
  directions_car: { family: "material", name: "directions-car" },
  directions_bus: { family: "material", name: "directions-bus" },
  directions_boat: { family: "material", name: "directions-boat" },
  flight_land: { family: "material", name: "flight-land" },
  calendar_today: { family: "material", name: "calendar-today" },
  weight: { family: "community", name: "weight-kilogram" },
  payments: { family: "material", name: "payments" },
  straighten: { family: "material", name: "straighten" },
  category: { family: "material", name: "category" },
  content_copy: { family: "material", name: "content-copy" },
  push_pin: { family: "material", name: "push-pin" },
  schedule: { family: "material", name: "schedule" },
};

interface IconProps {
  name: string;
  filled?: boolean;
  size?: number;
  className?: string;
  color?: string;
}

/**
 * `filled` n'a pas d'équivalent direct hors Material Symbols (variable font FILL axis) — pour les
 * quelques usages qui en dépendent (ex: étoile de notation), on bascule vers l'icône "filled" native
 * de MaterialIcons quand elle existe (ex: star ↔ star-outline).
 */
const FILLED_OVERRIDES: Record<string, { family: Family; name: string }> = {
  star: { family: "material", name: "star" },
};
const OUTLINED_OVERRIDES: Record<string, { family: Family; name: string }> = {
  star: { family: "material", name: "star-border" },
};

export function Icon({ name, filled, size = 24, className, color }: IconProps) {
  const override = filled ? FILLED_OVERRIDES[name] : OUTLINED_OVERRIDES[name];
  const resolved = override ?? ICON_NAME_MAP[name];

  if (!resolved) {
    if (__DEV__) console.warn(`[Icon] Aucune correspondance pour "${name}" dans ICON_NAME_MAP`);
    return null;
  }

  const commonProps: ComponentProps<typeof MaterialIcons> = {
    name: resolved.name as never,
    size,
    ...(color ? { color } : {}),
    className: className ?? "text-on-background",
  };

  return resolved.family === "community" ? (
    <MaterialCommunityIcons {...(commonProps as ComponentProps<typeof MaterialCommunityIcons>)} />
  ) : (
    <MaterialIcons {...commonProps} />
  );
}
