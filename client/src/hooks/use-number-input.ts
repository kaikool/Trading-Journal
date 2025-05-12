import { useCallback, useState } from "react";
import { useController, UseControllerProps, FieldValues, Path } from "react-hook-form";
import { NumberInputProps } from "@/components/ui/number-input";

// Định nghĩa interface cho phiên bản độc lập của hook
interface StandaloneNumberInputOptions {
  initial: number;
  min?: number;
  max?: number;
  step?: number;
  onChange?: (value: number) => void;
}

/**
 * Phiên bản overload của hook useNumberInput - sử dụng cho form
 */
export function useNumberInput<
  TFieldValues extends FieldValues = FieldValues,
  TName extends Path<TFieldValues> = Path<TFieldValues>
>(
  controllerProps: UseControllerProps<TFieldValues, TName>,
  inputProps?: Partial<Omit<NumberInputProps, "value" | "onChange">>
): {
  value: string | number;
  onChange: (value: number | null) => void;
  onBlur: () => void;
  name: string;
  ref: React.Ref<any>;
  error: any;
};

/**
 * Phiên bản overload của hook useNumberInput - sử dụng độc lập
 */
export function useNumberInput(
  options: StandaloneNumberInputOptions
): {
  value: number;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
};

/**
 * Triển khai hook cho cả hai trường hợp sử dụng
 */
export function useNumberInput(
  optionsOrControllerProps: UseControllerProps<any, any> | StandaloneNumberInputOptions,
  inputProps?: Partial<Omit<NumberInputProps, "value" | "onChange">>
) {
  // Kiểm tra xem đang sử dụng phiên bản nào của hook
  const isStandalone = 'initial' in optionsOrControllerProps;

  // Nếu là phiên bản độc lập
  if (isStandalone) {
    const options = optionsOrControllerProps as StandaloneNumberInputOptions;
    const [value, setValue] = useState<number>(options.initial || 0);

    const handleChange = useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = parseFloat(e.target.value);
        if (!isNaN(newValue)) {
          // Áp dụng giới hạn min/max nếu có
          let constrainedValue = newValue;
          if (options.min !== undefined && newValue < options.min) {
            constrainedValue = options.min;
          }
          if (options.max !== undefined && newValue > options.max) {
            constrainedValue = options.max;
          }
          
          setValue(constrainedValue);
          
          if (options.onChange) {
            options.onChange(constrainedValue);
          }
        }
      },
      [options]
    );

    return {
      value,
      onChange: handleChange
    };
  } 
  // Nếu là phiên bản form controller
  else {
    const controllerProps = optionsOrControllerProps as UseControllerProps<any, any>;
    const {
      field,
      fieldState: { error }
    } = useController(controllerProps);

    // Xử lý khi giá trị thay đổi từ NumberInput
    const handleValueChange = useCallback(
      (value: number | null) => {
        field.onChange(value);
      },
      [field]
    );

    return {
      // Thuộc tính cho NumberInput
      value: field.value === undefined || field.value === null ? "" : field.value,
      onChange: handleValueChange,
      onBlur: field.onBlur,
      name: field.name,
      ref: field.ref,
      // Trạng thái lỗi
      error,
      // Các props khác được truyền vào
      ...inputProps
    };
  }
}