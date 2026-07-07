// phone-prefix-selector.tsx
import { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { ChevronDown, Search } from "lucide-react";
import "./phone-prefix-selector.css";

export type PhonePrefixOption = {
  value: string;
  label: string;
  countryCode: string; // ISO 3166-1 alpha-2 code for flag image
  country: string;
};

export const PHONE_PREFIX_OPTIONS: PhonePrefixOption[] = [
  { value: "+502", label: "+502", countryCode: "gt", country: "Guatemala" },
  { value: "+34", label: "+34", countryCode: "es", country: "España" },
  { value: "+1", label: "+1", countryCode: "us", country: "USA / Canadá" },
  { value: "+52", label: "+52", countryCode: "mx", country: "México" },
  { value: "+33", label: "+33", countryCode: "fr", country: "France" },
  { value: "+44", label: "+44", countryCode: "gb", country: "United Kingdom" },
  { value: "+49", label: "+49", countryCode: "de", country: "Germany" },
  { value: "+39", label: "+39", countryCode: "it", country: "Italy" },
  { value: "+351", label: "+351", countryCode: "pt", country: "Portugal" },
  { value: "+55", label: "+55", countryCode: "br", country: "Brasil" },
  { value: "+54", label: "+54", countryCode: "ar", country: "Argentina" },
  { value: "+57", label: "+57", countryCode: "co", country: "Colombia" },
  { value: "+56", label: "+56", countryCode: "cl", country: "Chile" },
  { value: "+51", label: "+51", countryCode: "pe", country: "Perú" },
  { value: "+593", label: "+593", countryCode: "ec", country: "Ecuador" },
  { value: "+58", label: "+58", countryCode: "ve", country: "Venezuela" },
  { value: "+506", label: "+506", countryCode: "cr", country: "Costa Rica" },
  { value: "+507", label: "+507", countryCode: "pa", country: "Panamá" },
  { value: "+503", label: "+503", countryCode: "sv", country: "El Salvador" },
  { value: "+504", label: "+504", countryCode: "hn", country: "Honduras" },
  { value: "+505", label: "+505", countryCode: "ni", country: "Nicaragua" },
  { value: "+31", label: "+31", countryCode: "nl", country: "Netherlands" },
  { value: "+32", label: "+32", countryCode: "be", country: "Belgium" },
  { value: "+41", label: "+41", countryCode: "ch", country: "Switzerland" },
  { value: "+43", label: "+43", countryCode: "at", country: "Austria" },
  { value: "+48", label: "+48", countryCode: "pl", country: "Poland" },
  { value: "+46", label: "+46", countryCode: "se", country: "Sweden" },
  { value: "+47", label: "+47", countryCode: "no", country: "Norway" },
  { value: "+45", label: "+45", countryCode: "dk", country: "Denmark" },
  { value: "+358", label: "+358", countryCode: "fi", country: "Finland" },
  { value: "+353", label: "+353", countryCode: "ie", country: "Ireland" },
  { value: "+61", label: "+61", countryCode: "au", country: "Australia" },
  { value: "+64", label: "+64", countryCode: "nz", country: "New Zealand" },
  { value: "+81", label: "+81", countryCode: "jp", country: "Japan" },
  { value: "+82", label: "+82", countryCode: "kr", country: "South Korea" },
  { value: "+86", label: "+86", countryCode: "cn", country: "China" },
  { value: "+91", label: "+91", countryCode: "in", country: "India" },
  { value: "+971", label: "+971", countryCode: "ae", country: "UAE" },
];

// Flag image component using flagcdn.com
const FlagImage = ({ countryCode, size = "medium" }: { countryCode: string; size?: "small" | "medium" | "large" }) => {
  const sizeMap = {
    small: { width: 20, height: 15 },
    medium: { width: 24, height: 18 },
    large: { width: 32, height: 24 },
  };
  const { width, height } = sizeMap[size];

  return (
    <img
      src={`https://flagcdn.com/w40/${countryCode.toLowerCase()}.png`}
      srcSet={`https://flagcdn.com/w80/${countryCode.toLowerCase()}.png 2x`}
      width={width}
      height={height}
      alt={countryCode.toUpperCase()}
      className="phone-prefix-flag-img"
      loading="lazy"
    />
  );
};

type PhonePrefixSelectorProps = {
  value: string;
  onChange: (value: string) => void;
};

type DropdownPosition = {
  top: number;
  left: number;
  width: number;
};

export const PhonePrefixSelector = ({ value, onChange }: PhonePrefixSelectorProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [dropdownPosition, setDropdownPosition] = useState<DropdownPosition>({ top: 0, left: 0, width: 280 });
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const selectedOption = PHONE_PREFIX_OPTIONS.find((opt) => opt.value === value) || PHONE_PREFIX_OPTIONS[0];

  const filteredOptions = PHONE_PREFIX_OPTIONS.filter(
    (option) =>
      option.country.toLowerCase().includes(searchTerm.toLowerCase()) ||
      option.value.includes(searchTerm)
  );

  const updateDropdownPosition = useCallback(() => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + 8,
        left: rect.left,
        width: Math.max(280, rect.width),
      });
    }
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      const isInsideContainer = containerRef.current?.contains(target);
      const isInsideDropdown = dropdownRef.current?.contains(target);

      if (!isInsideContainer && !isInsideDropdown) {
        setIsOpen(false);
        setSearchTerm("");
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen) {
      updateDropdownPosition();
      if (searchInputRef.current) {
        searchInputRef.current.focus();
      }

      // Update position on scroll/resize
      const handleScrollResize = () => {
        updateDropdownPosition();
      };

      window.addEventListener("scroll", handleScrollResize, true);
      window.addEventListener("resize", handleScrollResize);

      return () => {
        window.removeEventListener("scroll", handleScrollResize, true);
        window.removeEventListener("resize", handleScrollResize);
      };
    }
  }, [isOpen, updateDropdownPosition]);

  const handleSelect = (optionValue: string) => {
    onChange(optionValue);
    setIsOpen(false);
    setSearchTerm("");
  };

  const dropdown = isOpen && createPortal(
    <div
      ref={dropdownRef}
      className="phone-prefix-dropdown phone-prefix-dropdown--portal"
      style={{
        position: 'fixed',
        top: dropdownPosition.top,
        left: dropdownPosition.left,
        width: dropdownPosition.width,
      }}
    >
      <div className="phone-prefix-search">
        <Search size={14} className="phone-prefix-search-icon" />
        <input
          ref={searchInputRef}
          type="text"
          placeholder="Search country..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="phone-prefix-search-input"
        />
      </div>

      <div className="phone-prefix-options">
        {filteredOptions.length > 0 ? (
          filteredOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              className={`phone-prefix-option ${option.value === value ? "phone-prefix-option--selected" : ""}`}
              onClick={() => handleSelect(option.value)}
            >
              <span className="phone-prefix-option-flag">
                <FlagImage countryCode={option.countryCode} size="large" />
              </span>
              <span className="phone-prefix-option-country">{option.country}</span>
              <span className="phone-prefix-option-code">{option.value}</span>
            </button>
          ))
        ) : (
          <div className="phone-prefix-no-results">No countries found</div>
        )}
      </div>
    </div>,
    document.body
  );

  return (
    <div className="phone-prefix-selector-container" ref={containerRef}>
      <button
        ref={triggerRef}
        type="button"
        className={`phone-prefix-trigger ${isOpen ? "phone-prefix-trigger--open" : ""}`}
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="phone-prefix-trigger-flag">
          <FlagImage countryCode={selectedOption.countryCode} size="medium" />
        </span>
        <span className="phone-prefix-trigger-code">{selectedOption.value}</span>
        <ChevronDown className={`phone-prefix-trigger-arrow ${isOpen ? "phone-prefix-trigger-arrow--open" : ""}`} size={14} />
      </button>

      {dropdown}
    </div>
  );
};
