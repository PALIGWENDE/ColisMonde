import { useState } from "react";
import { Platform, Pressable, Text, View } from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Icon } from "./Icon";

interface DateFieldProps {
  label: string;
  icon?: string;
  value: string; // ISO date (yyyy-mm-dd) ou vide
  onChange: (value: string) => void;
  minimumDate?: Date;
}

/** Équivalent RN de <input type="date"> (inexistant en React Native) via le picker natif iOS/Android. */
export function DateField({ label, icon = "calendar_month", value, onChange, minimumDate }: DateFieldProps) {
  const [open, setOpen] = useState(false);
  const date = value ? new Date(value) : new Date();

  return (
    <View className="gap-1.5">
      <Text className="font-label-md text-label-md text-on-surface-variant">{label}</Text>
      <Pressable
        onPress={() => setOpen(true)}
        className="flex-row items-center gap-3 rounded-xl border border-outline-variant/40 bg-surface p-3"
      >
        <Icon name={icon} className="text-on-surface-variant" />
        <Text className={value ? "font-body-md text-body-md text-on-surface" : "font-body-md text-body-md text-outline"}>
          {value ? date.toLocaleDateString("fr-FR") : "Sélectionner une date"}
        </Text>
      </Pressable>

      {open && (
        <DateTimePicker
          value={date}
          mode="date"
          display={Platform.OS === "ios" ? "inline" : "default"}
          minimumDate={minimumDate}
          onChange={(event, selected) => {
            setOpen(Platform.OS === "ios"); // iOS "inline" reste ouvert jusqu'à confirmation manuelle de l'utilisateur
            if (event.type === "dismissed") {
              setOpen(false);
              return;
            }
            if (selected) onChange(selected.toISOString().slice(0, 10));
          }}
        />
      )}
    </View>
  );
}
