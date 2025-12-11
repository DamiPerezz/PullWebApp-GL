// user-details-form.tsx
import { forwardRef, useImperativeHandle, useState, useEffect } from "react";
import "./user-details-form.css";
import { PHONE_PREFIX_OPTIONS, GENDER_OPTIONS } from "../../types/types";
import { User } from "lucide-react";

type UserDetailsFormProps = {
  quantity: number;
  initialData?: any;
  ticketGender?: 'male' | 'female' | null;
};

export const UserDetailsForm = forwardRef<{ submit: (onSubmit: (data: any) => void) => void }, UserDetailsFormProps>(
  ({ quantity, initialData, ticketGender }, ref) => {
    const [formData, setFormData] = useState<any[]>([]);
    const [errors, setErrors] = useState<Record<number, Record<string, string>>>({});

    const getAvailableGenderOptions = () => {
      if (!ticketGender) return GENDER_OPTIONS;
      return GENDER_OPTIONS.filter(option => option.value === ticketGender);
    };

    useEffect(() => {
      const initialFormData = Array.from({ length: quantity }, (_, i) => {
        const existingData = initialData?.usuarios?.[i] || initialData?.[i] || {};
        return {
          owner_name: existingData.owner_name || "",
          owner_last_name: existingData.owner_last_name || "",
          owner_email: existingData.owner_email || "",
          owner_phone: existingData.owner_phone || "",
          owner_phone_prefix: existingData.owner_phone_prefix || "+502",
          owner_dpi: existingData.owner_dpi || "",
          owner_birthdate: existingData.owner_birthdate || "",
          owner_gender: existingData.owner_gender || ticketGender || "",
        };
      });

      setFormData(initialFormData);
    }, [quantity, initialData, ticketGender]);

    const handleInputChange = (index: number, field: string, value: string) => {
      setFormData((prev) => {
        const updated = [...prev];
        updated[index] = { ...updated[index], [field]: value };
        return updated;
      });

      setErrors((prev) => {
        const updated = { ...prev };
        if (updated[index]?.[field]) {
          delete updated[index][field];
          if (Object.keys(updated[index]).length === 0) {
            delete updated[index];
          }
        }
        return updated;
      });
    };

    const validate = (): boolean => {
      const newErrors: Record<number, Record<string, string>> = {};

      formData.forEach((data, index) => {
        const ticketErrors: Record<string, string> = {};

        if (!data.owner_name?.trim()) {
          ticketErrors.owner_name = "Name is required";
        }
        
        if (!data.owner_last_name?.trim()) {
          ticketErrors.owner_last_name = "Last name is required";
        }
        
        if (!data.owner_email?.trim()) {
          ticketErrors.owner_email = "Email is required";
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.owner_email)) {
          ticketErrors.owner_email = "Invalid email format";
        }

        if (!data.owner_phone?.trim()) {
          ticketErrors.owner_phone = "Phone number is required";
        } else if (!/^\d{6,15}$/.test(data.owner_phone)) {
          ticketErrors.owner_phone = "Phone must be 6-15 digits";
        }

        if (!data.owner_birthdate?.trim()) {
          ticketErrors.owner_birthdate = "Date of birth is required";
        } else {
          const birthDate = new Date(data.owner_birthdate);
          const today = new Date();
          const age = today.getFullYear() - birthDate.getFullYear();
          if (birthDate > today) {
            ticketErrors.owner_birthdate = "Date cannot be in the future";
          } else if (age < 18) {
            ticketErrors.owner_birthdate = "Must be 18 years or older";
          }
        }

        if (Object.keys(ticketErrors).length > 0) {
          newErrors[index] = ticketErrors;
        }
      });

      setErrors(newErrors);
      return Object.keys(newErrors).length === 0;
    };

    useImperativeHandle(ref, () => ({
      submit: (onSubmit) => {
        if (validate()) {
          onSubmit({ usuarios: formData });
        }
      },
    }));

    const availableGenderOptions = getAvailableGenderOptions();

    return (
      <div className="user-details-form-container">
        {formData.map((data, index) => (
          <div key={index} className="user-details-form">
            <h4>
              <span className="user-details-form-number">{index + 1}</span>
              Attendee {index + 1} Details
            </h4>

            <div className="sep"></div>

            <div className="form-content-container">
              <div className="form-field">
                <label>
                  Name <span className="form-field-required">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Enter name"
                  value={data.owner_name}
                  onChange={(e) => handleInputChange(index, "owner_name", e.target.value)}
                  maxLength={50}
                />
                {errors[index]?.owner_name && <p className="user-form-error">{errors[index].owner_name}</p>}
              </div>

              <div className="form-field">
                <label>
                  Last Name <span className="form-field-required">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Enter last name"
                  value={data.owner_last_name}
                  onChange={(e) => handleInputChange(index, "owner_last_name", e.target.value)}
                  maxLength={50}
                />
                {errors[index]?.owner_last_name && <p className="user-form-error">{errors[index].owner_last_name}</p>}
              </div>

              <div className="form-field">
                <label>
                  Email <span className="form-field-required">*</span>
                </label>
                <input
                  type="email"
                  placeholder="email@example.com"
                  value={data.owner_email}
                  onChange={(e) => handleInputChange(index, "owner_email", e.target.value)}
                  maxLength={100}
                />
                {errors[index]?.owner_email && <p className="user-form-error">{errors[index].owner_email}</p>}
              </div>

              <div className="form-field">
                <label>
                  Phone <span className="form-field-required">*</span>
                </label>
                <div className="phone-input-container">
                  <div className="phone-prefix-select">
                    <select
                      value={data.owner_phone_prefix}
                      onChange={(e) => handleInputChange(index, "owner_phone_prefix", e.target.value)}
                    >
                      {PHONE_PREFIX_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.flag} {option.value}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="phone-number-input">
                    <input
                      type="tel"
                      placeholder="612345678"
                      value={data.owner_phone}
                      onChange={(e) => handleInputChange(index, "owner_phone", e.target.value)}
                      maxLength={15}
                    />
                  </div>
                </div>
                {errors[index]?.owner_phone && <p className="user-form-error">{errors[index].owner_phone}</p>}
              </div>

              <div className="form-field">
                <label>
                  Date of Birth <span className="form-field-required">*</span>
                </label>
                <input
                  type="date"
                  value={data.owner_birthdate}
                  onChange={(e) => handleInputChange(index, "owner_birthdate", e.target.value)}
                  max={new Date().toISOString().split('T')[0]}
                />
                {errors[index]?.owner_birthdate && <p className="user-form-error">{errors[index].owner_birthdate}</p>}
              </div>

              <div className="form-field">
                <label>
                  <User size={14} style={{ marginRight: '0.25rem' }} />
                  Gender {ticketGender && <span style={{ fontSize: '0.75rem', color: 'rgba(167, 139, 250, 0.8)' }}>(Required by ticket type)</span>}
                </label>
                <div className="gender-selection">
                  {availableGenderOptions.map((option) => (
                    <div key={option.value} className="gender-option">
                      <input
                        type="radio"
                        id={`gender-${index}-${option.value}`}
                        name={`gender-${index}`}
                        value={option.value}
                        checked={data.owner_gender === option.value}
                        onChange={(e) => handleInputChange(index, "owner_gender", e.target.value)}
                        disabled={!!ticketGender}
                      />
                      <label htmlFor={`gender-${index}-${option.value}`} className="gender-label">
                        {option.label}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }
);