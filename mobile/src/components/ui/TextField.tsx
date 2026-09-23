import { forwardRef } from "react";
import { Text, TextInput, View, type TextInputProps } from "react-native";
import clsx from "clsx";
import { Icon } from "./Icon";

interface TextFieldProps extends TextInputProps {
  label?: string;
  icon?: string;
  error?: string;
}

export const TextField = forwardRef<TextInput, TextFieldProps>(({ label, icon, error, className, style, ...props }, ref) => {
  return (
    <View className="gap-1.5">
      {label && <Text className="font-label-md text-label-md text-on-surface-variant">{label}</Text>}
      <View
        className={clsx(
          "flex-row items-center gap-3 rounded-xl border bg-surface p-3",
          error ? "border-error" : "border-outline-variant/40",
        )}
      >
        {icon && <Icon name={icon} className="text-on-surface-variant" />}
        <TextInput
          ref={ref}
          className={clsx("flex-1 font-body-md text-body-md text-on-surface", className)}
          placeholderTextColor="#6f797a"
          style={style}
          {...props}
        />
      </View>
      {error && <Text className="font-label-sm text-label-sm text-error">{error}</Text>}
    </View>
  );
});
TextField.displayName = "TextField";
