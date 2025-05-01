import * as React from "react";
import { useState, useEffect, useCallback, forwardRef } from "react";
import { Input } from "./input";
import { cn } from "@/lib/utils";

export interface NumberInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange"> {
  value: number | string;
  onChange: (value: number | null) => void;
  decimalPlaces?: number;
  min?: number;
  max?: number;
  step?: number;
  allowNegative?: boolean;
  className?: string;
  formatOptions?: Intl.NumberFormatOptions;
  onBlur?: React.FocusEventHandler<HTMLInputElement>;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
}

/**
 * Số biết được locale hiện tại và tự động định dạng dấu thập phân phù hợp
 * Hỗ trợ cả kiểu nhập dấu chấm (.) và dấu phảy (,) cho các vùng địa lý khác nhau
 */
const NumberInput = forwardRef<HTMLInputElement, NumberInputProps>(
  (
    {
      value,
      onChange,
      decimalPlaces = 2,
      min,
      max,
      step = 0.01,
      allowNegative = true,
      className,
      formatOptions,
      onBlur,
      inputMode = "decimal", // default to decimal keypad
      ...props
    },
    ref
  ) => {
    // Lưu trạng thái hiện tại của input
    const [inputValue, setInputValue] = useState("");
    
    // Lưu trạng thái giá trị đã được định dạng
    const [formattedValue, setFormattedValue] = useState("");
    
    // Lấy locale hiện tại của trình duyệt
    const [locale, setLocale] = useState(
      typeof navigator !== "undefined" ? navigator.language : "vi-VN"
    );
    
    // Xác định ký tự phân cách thập phân theo locale
    const [decimalSeparator, setDecimalSeparator] = useState<string>(".");
    
    // Khởi tạo định dạng số và xác định dấu thập phân
    useEffect(() => {
      // Cố gắng lấy locale của người dùng
      try {
        const userLocale = navigator.language || "vi-VN";
        setLocale(userLocale);
        
        // Xác định dấu thập phân bằng cách định dạng số 1.1
        const formatter = new Intl.NumberFormat(userLocale);
        const parts = formatter.formatToParts(1.1);
        const decimal = parts.find(part => part.type === "decimal");
        
        if (decimal) {
          setDecimalSeparator(decimal.value);
        }
      } catch (error) {
        console.error("Không thể xác định locale hoặc dấu thập phân:", error);
        // Fallback to dot as decimal separator
        setDecimalSeparator(".");
      }
    }, []);
    
    // Chuyển đổi giá trị ban đầu thành chuỗi hiển thị trong input
    useEffect(() => {
      if (value === "" || value === null || value === undefined) {
        setInputValue("");
        setFormattedValue("");
        return;
      }
      
      // Nếu input đang được focus và người dùng đang nhập, không ghi đè
      const refElement = typeof ref === 'function' ? null : ref?.current;
      if (document.activeElement === refElement) {
        return;
      }
      
      // Chuyển đổi value thành số
      const numValue = typeof value === "string" ? parseFloat(value.replace(/,/g, '.')) : value;
      
      // Nếu là số và hợp lệ
      if (!isNaN(numValue)) {
        // Định dạng số với độ chính xác thập phân cần thiết
        try {
          // Chỉ hiển thị số thập phân nếu cần thiết
          const options: Intl.NumberFormatOptions = {
            minimumFractionDigits: 0,
            maximumFractionDigits: decimalPlaces,
            useGrouping: false, // Không sử dụng dấu phân tách hàng nghìn
            ...formatOptions
          };
          
          // Định dạng số cho hiển thị
          const formatted = new Intl.NumberFormat(locale, options).format(numValue);
          setFormattedValue(formatted);
          setInputValue(formatted);
        } catch (error) {
          console.error("Lỗi định dạng số:", error);
          // Fallback nếu có lỗi
          setInputValue(numValue.toString());
        }
      } else {
        setInputValue("");
        setFormattedValue("");
      }
    }, [value, locale, decimalPlaces, formatOptions, ref]);
    
    // Xử lý khi người dùng nhập
    const handleInputChange = useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        
        // Always update the displayed value
        setInputValue(val);
        
        // Nếu input rỗng, trả về null
        if (!val.trim()) {
          onChange(null);
          return;
        }
        
        // QUAN TRỌNG: Cho phép nhập các ký tự đặc biệt trong quá trình nhập
        // Người dùng có thể đang nhập một số chưa hoàn chỉnh
        const validInput = /^-?[0-9]*[.,]?[0-9]*$/.test(val);
        if (!validInput) {
          return; // Bỏ qua nếu có ký tự không phải số, dấu phẩy hoặc chấm
        }
        
        // Trường hợp đặc biệt: chỉ có dấu phân cách thập phân hoặc dấu âm (đang nhập dở)
        if (val === "." || val === "," || val === "-" || val === "-." || val === "-,") {
          // Không xử lý gì cả - đang chờ người dùng nhập tiếp
          return;
        }
        
        // Kiểm tra dấu thập phân đầu tiên trong chuỗi đang nhập
        const hasDot = val.includes(".");
        const hasComma = val.includes(",");
        
        // Xác định dấu thập phân thực tế trong input hiện tại
        let actualDecimalSeparator = null;
        if (hasDot) actualDecimalSeparator = ".";
        if (hasComma) actualDecimalSeparator = ",";
        
        // Chuẩn hóa chuỗi để chuyển thành số
        let processedValue = val;
        
        // Bước 1: Xóa tất cả dấu phân nhóm không phải dấu thập phân
        // Bước 2: Chuyển dấu thập phân về dấu chấm cho parseFloat
        if (actualDecimalSeparator === ",") {
          // Xử lý khi dấu phẩy là dấu thập phân
          processedValue = processedValue.replace(/\./g, "");  // Xóa dấu chấm (có thể là dấu phân nhóm)
          processedValue = processedValue.replace(/,/g, "."); // Chuyển dấu phẩy thành dấu chấm
        } else if (actualDecimalSeparator === ".") {
          // Xử lý khi dấu chấm là dấu thập phân
          processedValue = processedValue.replace(/,/g, ""); // Xóa dấu phẩy (có thể là dấu phân nhóm)
        }
        
        // Chuyển đổi sang số
        const numericValue = parseFloat(processedValue);
        
        // Kiểm tra giá trị hợp lệ
        if (!isNaN(numericValue)) {
          // Kiểm tra giới hạn min/max
          let finalValue = numericValue;
          
          if (min !== undefined && numericValue < min) {
            finalValue = min;
          }
          if (max !== undefined && numericValue > max) {
            finalValue = max;
          }
          
          // Không cho phép số âm nếu allowNegative = false
          if (!allowNegative && finalValue < 0) {
            finalValue = 0;
          }
          
          // Cập nhật giá trị mới
          onChange(finalValue);
        }
      },
      [onChange, min, max, allowNegative]
    );
    
    // Xử lý khi blur input (mất focus)
    const handleBlur = useCallback(
      (e: React.FocusEvent<HTMLInputElement>) => {
        // Kiểm tra giá trị hiện tại
        const val = e.target.value;
        
        // Nếu rỗng, không cần xử lý
        if (!val.trim()) {
          return;
        }
        
        // Đối với các trường hợp nhập chưa hoàn chỉnh (chỉ có dấu thập phân)
        if (val === "." || val === "," || val === "-" || val === "-." || val === "-,") {
          // Nếu chỉ có dấu thập phân, đặt về 0
          onChange(0);
          setInputValue("0");
          return;
        }
        
        // Chuyển đổi và định dạng giá trị
        try {
          // Kiểm tra và chuẩn hóa giá trị
          const hasDot = val.includes(".");
          const hasComma = val.includes(",");
          
          // Xác định dấu thập phân
          let actualDecimalSeparator = null;
          if (hasDot) actualDecimalSeparator = ".";
          if (hasComma) actualDecimalSeparator = ",";
          
          // Chuẩn hóa giá trị
          let processedValue = val;
          if (actualDecimalSeparator === ",") {
            processedValue = processedValue.replace(/\./g, "");
            processedValue = processedValue.replace(/,/g, ".");
          } else if (actualDecimalSeparator === ".") {
            processedValue = processedValue.replace(/,/g, "");
          }
          
          // Chuyển đổi thành số
          const numValue = parseFloat(processedValue);
          
          if (!isNaN(numValue)) {
            // Định dạng lại với độ chính xác thập phân mong muốn
            const options: Intl.NumberFormatOptions = {
              minimumFractionDigits: 0,
              maximumFractionDigits: decimalPlaces,
              useGrouping: false,
              ...formatOptions
            };
            
            // Cập nhật giá trị đã định dạng
            const formatted = new Intl.NumberFormat(locale, options).format(numValue);
            setFormattedValue(formatted);
            setInputValue(formatted);
          }
        } catch (error) {
          console.error("Lỗi khi format số:", error);
        }
        
        // Gọi onBlur handler gốc nếu được cung cấp
        if (onBlur) {
          onBlur(e);
        }
      },
      [decimalPlaces, formatOptions, locale, onChange, onBlur]
    );
    
    // Xử lý khi focus vào input
    const handleFocus = useCallback((e: React.FocusEvent<HTMLInputElement>) => {
      // Chọn toàn bộ text khi focus
      e.target.select();
    }, []);
    
    return (
      <Input
        ref={ref}
        type="text"
        inputMode={inputMode}
        value={inputValue}
        onChange={handleInputChange}
        onBlur={handleBlur}
        onFocus={handleFocus}
        className={cn("font-mono", className)}
        {...props}
      />
    );
  }
);

NumberInput.displayName = "NumberInput";

export { NumberInput };