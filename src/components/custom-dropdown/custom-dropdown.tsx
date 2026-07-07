// custom-dropdown.tsx
import { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { ChevronDown, Check } from "lucide-react";
import "./custom-dropdown.css";

export type DropdownOption = {
  value: string;
  label: string;
  icon?: React.ReactNode;
};

type CustomDropdownProps = {
  value: string;
  onChange: (value: string) => void;
  options: DropdownOption[];
  placeholder?: string;
  icon?: React.ReactNode;
  className?: string;
};

type DropdownPosition = {
  top: number;
  left: number;
  width: number;
};

export const CustomDropdown = ({
  value,
  onChange,
  options,
  placeholder = "Select...",
  icon,
  className = ""
}: CustomDropdownProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState<DropdownPosition>({ top: 0, left: 0, width: 200 });
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);

  const updateDropdownPosition = useCallback(() => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const dropdownHeight = Math.min(options.length * 44 + 16, 280); // Estimate dropdown height

      // Check if dropdown would overflow bottom
      const spaceBelow = viewportHeight - rect.bottom - 8;
      const openUpward = spaceBelow < dropdownHeight && rect.top > dropdownHeight;

      setDropdownPosition({
        top: openUpward ? rect.top - dropdownHeight - 8 : rect.bottom + 8,
        left: rect.left,
        width: rect.width,
      });
    }
  }, [options.length]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      const isInsideContainer = containerRef.current?.contains(target);
      const isInsideDropdown = dropdownRef.current?.contains(target);

      if (!isInsideContainer && !isInsideDropdown) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen) {
      updateDropdownPosition();

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
  };

  const dropdown = isOpen && createPortal(
    <div
      ref={dropdownRef}
      className="custom-dropdown-menu custom-dropdown-menu--portal"
      style={{
        position: 'fixed',
        top: dropdownPosition.top,
        left: dropdownPosition.left,
        width: dropdownPosition.width,
      }}
    >
      <div className="custom-dropdown-options">
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            className={`custom-dropdown-option ${option.value === value ? "custom-dropdown-option--selected" : ""}`}
            onClick={() => handleSelect(option.value)}
          >
            {option.icon && <span className="custom-dropdown-option-icon">{option.icon}</span>}
            <span className="custom-dropdown-option-label">{option.label}</span>
            {option.value === value && (
              <Check size={14} className="custom-dropdown-option-check" />
            )}
          </button>
        ))}
      </div>
    </div>,
    document.body
  );

  return (
    <div className={`custom-dropdown-container ${className}`} ref={containerRef}>
      <button
        ref={triggerRef}
        type="button"
        className={`custom-dropdown-trigger ${isOpen ? "custom-dropdown-trigger--open" : ""}`}
        onClick={() => setIsOpen(!isOpen)}
      >
        {icon && <span className="custom-dropdown-trigger-icon">{icon}</span>}
        <span className="custom-dropdown-trigger-text">
          {selectedOption?.label || placeholder}
        </span>
        <ChevronDown
          className={`custom-dropdown-trigger-arrow ${isOpen ? "custom-dropdown-trigger-arrow--open" : ""}`}
          size={14}
        />
      </button>

      {dropdown}
    </div>
  );
};
