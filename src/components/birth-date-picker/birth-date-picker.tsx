// birth-date-picker.tsx
import { forwardRef, useState, useEffect } from "react";
import DatePicker from "react-datepicker";
import { Calendar, ChevronDown } from "lucide-react";
import "react-datepicker/dist/react-datepicker.css";
import "./birth-date-picker.css";

type BirthDatePickerProps = {
  value: string; // Format: YYYY-MM-DD
  onChange: (value: string) => void;
  minAge?: number | string;
  placeholder?: string;
  error?: string;
};

// Parse minAge - extract only digits from strings like "+21", "18+", "21 years", etc.
// Optimized: uses bitwise OR for fast integer conversion
export const parseMinAge = (minAge: number | string | undefined): number => {
  if (minAge === undefined || minAge === null) return 18;
  if (typeof minAge === 'number') return minAge | 0; // Fast integer conversion
  // Extract digits only and convert to number
  const digits = minAge.replace(/\D/g, '');
  return digits ? (parseInt(digits, 10) | 0) : 18;
};

// Calculate the maximum date allowed based on minimum age
const getMaxDate = (minAge: number): Date => {
  const today = new Date();
  return new Date(today.getFullYear() - minAge, today.getMonth(), today.getDate());
};

// Parse date string in DD/MM/YYYY format
const parseDateString = (input: string): Date | null => {
  const cleaned = input.trim();
  if (!cleaned) return null;

  // Try DD/MM/YYYY format
  const match = cleaned.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (match) {
    const [, day, month, year] = match;
    const d = parseInt(day), m = parseInt(month), y = parseInt(year);
    if (d >= 1 && d <= 31 && m >= 1 && m <= 12 && y >= 1900 && y <= 2100) {
      const date = new Date(y, m - 1, d);
      if (date.getDate() === d && date.getMonth() === m - 1) {
        return date;
      }
    }
  }
  return null;
};

// Input mask: DD/MM/YYYY - slashes always visible, user replaces D, M, Y
const MASK = "DD/MM/YYYY";

const applyMask = (digits: string): string => {
  let result = "";
  let digitIndex = 0;

  for (let i = 0; i < MASK.length; i++) {
    const maskChar = MASK[i];
    if (maskChar === "/") {
      result += "/";
    } else if (digitIndex < digits.length) {
      result += digits[digitIndex];
      digitIndex++;
    } else {
      result += maskChar;
    }
  }

  return result;
};

const extractDigits = (value: string): string => {
  return value.replace(/\D/g, "").slice(0, 8);
};

// Custom input component for the date picker
const CustomInput = forwardRef<HTMLInputElement, {
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  maskedValue?: string; // Our controlled value (not from react-datepicker)
  onMaskedChange?: (e: React.ChangeEvent<HTMLInputElement>) => void; // Our change handler
  onClick?: () => void;
  onBlur?: () => void;
  onFocus?: () => void;
  error?: string;
  placeholder?: string;
  isFocused?: boolean;
}>(
  ({ maskedValue, onMaskedChange, onClick, onBlur, onFocus, error, placeholder, isFocused }, ref) => {
    // Check if value contains placeholder characters (D, M, Y)
    const isEmpty = !maskedValue || maskedValue === MASK;
    const isPlaceholder = isEmpty && !isFocused;

    // Show placeholder text when empty and not focused, otherwise show mask
    const displayValue = isPlaceholder ? "" : (maskedValue || MASK);

    return (
      <div className={`birth-date-trigger ${error ? "birth-date-trigger--error" : ""}`}>
        <input
          ref={ref}
          type="text"
          className={`birth-date-input ${isEmpty ? "birth-date-input--placeholder" : ""}`}
          value={displayValue}
          onChange={onMaskedChange}
          onBlur={onBlur}
          onFocus={onFocus}
          maxLength={10}
          inputMode="numeric"
          placeholder={placeholder}
        />
        <button
          type="button"
          className="birth-date-calendar-btn"
          onClick={onClick}
          aria-label="Open calendar"
        >
          <Calendar size={14} />
          <ChevronDown size={12} />
        </button>
      </div>
    );
  }
);

CustomInput.displayName = "CustomInput";

export const BirthDatePicker = ({
  value,
  onChange,
  minAge,
  placeholder = "DD/MM/YYYY",
  error
}: BirthDatePickerProps) => {
  // Parse minAge once - handles "+21", "18+", "21 years", etc.
  const parsedMinAge = parseMinAge(minAge);
  const maxDate = getMaxDate(parsedMinAge);
  const minDate = new Date(1900, 0, 1);
  const [inputValue, setInputValue] = useState(MASK);
  const [isFocused, setIsFocused] = useState(false);

  // Sync input value with external value
  useEffect(() => {
    if (value) {
      const [year, month, day] = value.split("-");
      setInputValue(`${day}/${month}/${year}`);
    } else {
      setInputValue(MASK);
    }
  }, [value]);

  // Convert string value to Date object
  const selectedDate = value ? new Date(value) : null;

  // Handle date change from calendar
  const handleChange = (date: Date | null) => {
    if (date) {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      onChange(`${year}-${month}-${day}`);
    }
  };

  // Handle manual input with mask
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digits = extractDigits(e.target.value);
    const masked = applyMask(digits);
    setInputValue(masked);

    // Try to parse the date when all 8 digits entered
    if (digits.length === 8) {
      const parsed = parseDateString(masked);
      // If structurally valid date, always call onChange to allow parent validation
      // The parent form will handle age validation and show appropriate errors
      if (parsed && parsed >= minDate) {
        const year = parsed.getFullYear();
        const month = String(parsed.getMonth() + 1).padStart(2, '0');
        const day = String(parsed.getDate()).padStart(2, '0');
        onChange(`${year}-${month}-${day}`);
      }
    }
  };

  // Handle focus
  const handleFocus = () => {
    setIsFocused(true);
    // If empty, show the mask when focused
    if (!value && inputValue === MASK) {
      setInputValue(MASK);
    }
  };

  // Handle blur - validate and reset if invalid
  const handleBlur = () => {
    setIsFocused(false);
    const digits = extractDigits(inputValue);
    if (digits.length > 0 && digits.length < 8) {
      // Incomplete - reset to previous valid value or mask
      if (value) {
        const [year, month, day] = value.split("-");
        setInputValue(`${day}/${month}/${year}`);
      } else {
        setInputValue(MASK);
      }
    } else if (digits.length === 8 && !parseDateString(inputValue)) {
      // Complete but invalid date - reset
      if (value) {
        const [year, month, day] = value.split("-");
        setInputValue(`${day}/${month}/${year}`);
      } else {
        setInputValue(MASK);
      }
    }
  };

  return (
    <div className="birth-date-picker-container">
      <DatePicker
        selected={selectedDate}
        onChange={handleChange}
        maxDate={maxDate}
        minDate={minDate}
        dateFormat="dd/MM/yyyy"
        placeholderText={placeholder}
        showYearDropdown
        showMonthDropdown
        dropdownMode="select"
        yearDropdownItemNumber={100}
        scrollableYearDropdown
        customInput={
          <CustomInput
            error={error}
            maskedValue={inputValue}
            onMaskedChange={handleInputChange}
            onBlur={handleBlur}
            onFocus={handleFocus}
            placeholder={placeholder}
            isFocused={isFocused}
          />
        }
        popperClassName="birth-date-popper"
        calendarClassName="birth-date-calendar"
        wrapperClassName="birth-date-wrapper"
        portalId="root"
      />
    </div>
  );
};
