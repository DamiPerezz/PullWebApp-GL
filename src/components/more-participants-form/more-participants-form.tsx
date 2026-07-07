import { useState } from "react";
import { useTranslation } from 'react-i18next';
import { CloseXIcon } from "../../icons/icons";
import "./more-participants-form.css";

export const MoreParticipantsForm = ({
  handleClose,
  onAddGuests,
}: {
  handleClose: () => void;
  onAddGuests: (guestNames: string[]) => void;
}) => {
  const { t } = useTranslation('common');
  const [guestNames, setGuestNames] = useState<string[]>([""]);
  const [errors, setErrors] = useState<string[]>([]);

  const addGuestField = () => {
    setGuestNames([...guestNames, ""]);
    setErrors([...errors, ""]);
  };

  const removeGuestField = (index: number) => {
    setGuestNames(guestNames.filter((_, i) => i !== index));
    setErrors(errors.filter((_, i) => i !== index));
  };

  const updateGuestName = (index: number, name: string) => {
    const updated = [...guestNames];
    updated[index] = name;
    setGuestNames(updated);

    const updatedErrors = [...errors];
    updatedErrors[index] = "";
    setErrors(updatedErrors);
  };

  const validateAndSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const validNames: string[] = [];
    const newErrors: string[] = [];

    guestNames.forEach((name, index) => {
      const trimmedName = name.trim();
      if (trimmedName === "") {
        newErrors[index] = t('validation.nameRequired');
      } else if (trimmedName.length < 2) {
        newErrors[index] = t('validation.nameMinLength');
      } else {
        newErrors[index] = "";
        validNames.push(trimmedName);
      }
    });

    setErrors(newErrors);

    if (validNames.length > 0 && validNames.length === guestNames.length) {
      onAddGuests(validNames);
      handleClose();
    }
  };

  const guestCount = guestNames.filter((name) => name.trim()).length;

  return (
    <div className="more-participants-form">
      <form onSubmit={validateAndSubmit}>
        <p>{t('participants.addMore')}</p>

        {/* Contenedor scrolleable para múltiples inputs */}
        <div className="guests-container">
          {guestNames.map((name, index) => (
            <div key={index} className="guest-input-group">
              <label>{t('participants.guestName', { number: index + 1 })}:</label>
              <div className="input-with-remove">
                <input
                  type="text"
                  placeholder={t('participants.enterGuestName')}
                  value={name}
                  onChange={(e) => updateGuestName(index, e.target.value)}
                  required
                />
                {guestNames.length > 1 && (
                  <button
                    type="button"
                    className="remove-guest-btn"
                    onClick={() => removeGuestField(index)}
                  >
                    ×
                  </button>
                )}
              </div>
              {errors[index] && (
                <span className="error-message">{errors[index]}</span>
              )}
            </div>
          ))}

          {guestNames.length < 10 && (
            <button
              type="button"
              className="add-guest-btn"
              onClick={addGuestField}
            >
              {t('participants.addAnother')}
            </button>
          )}
        </div>

        <button
          type="submit"
          disabled={guestNames.every((name) => !name.trim())}
        >
          {guestCount === 1 ? t('participants.addGuest', { count: guestCount }) : t('participants.addGuests', { count: guestCount })}
        </button>

        <button type="button" className="close-button" onClick={handleClose}>
          <CloseXIcon strokeColor="white" />
        </button>
      </form>
    </div>
  );
};
