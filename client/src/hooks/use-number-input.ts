import { useCallback } from "react";
import { useController, UseControllerProps, FieldValues, Path } from "react-hook-form";
import { NumberInputProps } from "@/components/ui/number-input";

/**
 * Custom hook để sử dụng NumberInput với react-hook-form
 * Tự động xử lý việc chuyển đổi giữa chuỗi và số và quản lý validate
 * 
 * @param controllerProps Props cho Controller từ react-hook-form
 * @param inputProps Props cho NumberInput component
 * @returns Object chứa các thuộc tính và phương thức để sử dụng với NumberInput
 */
export function useNumberInput<
  TFieldValues extends FieldValues = FieldValues,
  TName extends Path<TFieldValues> = Path<TFieldValues>
>(
  controllerProps: UseControllerProps<TFieldValues, TName>,
  inputProps?: Partial<Omit<NumberInputProps, "value" | "onChange">>
) {
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