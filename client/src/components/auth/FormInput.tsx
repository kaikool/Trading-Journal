import { ReactNode } from "react";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { UseFormReturn } from "react-hook-form";
import { Icons, getIcon } from "@/components/icons/icons";

interface FormInputProps {
  form: UseFormReturn<any, any>;
  name: string;
  label: string;
  placeholder?: string;
  type?: string;
  disabled?: boolean;
  autoComplete?: string;
  icon?: React.ComponentType<{ className?: string }>;
  description?: string;
  className?: string;
}

export function FormInput({
  form,
  name,
  label,
  placeholder,
  type = "text",
  disabled = false,
  autoComplete,
  icon: Icon,
  description,
  className,
}: FormInputProps) {
  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem className={className}>
          <FormLabel className="font-medium text-foreground/90">{label}</FormLabel>
          {description && <p className="text-xs text-muted-foreground mb-2">{description}</p>}
          <FormControl>
            <div className="relative">
              {Icon && (
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <Icon className="w-4 h-4 text-muted-foreground" />
                </div>
              )}
              <Input
                placeholder={placeholder}
                type={type}
                autoComplete={autoComplete}
                disabled={disabled}
                className={Icon ? "pl-10" : ""}
                {...field}
              />
            </div>
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

export default FormInput;