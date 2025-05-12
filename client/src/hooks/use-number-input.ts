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

// Kết quả trả về cho phiên bản form
type FormNumberInputResult = {
  value: string | number;
  onChange: (value: number | null) => void;
  onBlur: () => void;
  name: string;
  ref: React.Ref<any>;
  error: any;
  [key: string]: any;
};

// Kết quả trả về cho phiên bản độc lập
type StandaloneNumberInputResult = {
  value: number;
  onChange: (e: any) => void;
};

// Type chung cho cả hai phiên bản
type NumberInputResult = FormNumberInputResult | StandaloneNumberInputResult;

/**
 * Hook useNumberInput - hỗ trợ cả hai chế độ: form controller và standalone
 */
export function useNumberInput(
  optionsOrControllerProps: UseControllerProps<any, any> | StandaloneNumberInputOptions,
  inputProps?: Partial<Omit<NumberInputProps, "value" | "onChange">>
): NumberInputResult {
  // Kiểm tra xem đang sử dụng phiên bản nào của hook
  const isStandalone = 'initial' in optionsOrControllerProps;

  // Nếu là phiên bản độc lập
  if (isStandalone) {
    const options = optionsOrControllerProps as StandaloneNumberInputOptions;
    const [value, setValue] = useState<number>(options.initial || 0);

    const handleChange = useCallback(
      (e: any) => {
        const inputValue = typeof e === 'object' && e.target 
          ? e.target.value 
          : e;
          
        const newValue = parseFloat(String(inputValue));
        
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