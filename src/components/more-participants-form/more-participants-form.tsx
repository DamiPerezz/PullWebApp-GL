import { useState } from "react";
import { CloseXIcon } from "../../icons/icons";
import "./more-participants-form.css";

export const MoreParticipantsForm = ({
  handleClose,
  onAddGuests,
}: {
  handleClose: () => void;
  onAddGuests: (guestNames: string[]) => void;
}) => {
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
        newErrors[index] = "Name is required";
      } else if (trimmedName.length < 2) {
        newErrors[index] = "Name must be at least 2 characters";
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

  return (
    <div className="more-participants-form">
      <form onSubmit={validateAndSubmit}>
        <p>Add More Participants</p>

        {/* Contenedor scrolleable para múltiples inputs */}
        <div className="guests-container">
          {guestNames.map((name, index) => (
            <div key={index} className="guest-input-group">
              <label>Guest {index + 1} Name:</label>
              <div className="input-with-remove">
                <input
                  type="text"
                  placeholder="Enter guest name"
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
              + Add Another Guest
            </button>
          )}
        </div>

        <button
          type="submit"
          disabled={guestNames.every((name) => !name.trim())}
        >
          Add {guestNames.filter((name) => name.trim()).length} Guest
          {guestNames.filter((name) => name.trim()).length !== 1 ? "s" : ""}
        </button>

        <button type="button" className="close-button" onClick={handleClose}>
          <CloseXIcon strokeColor="white" />
        </button>
      </form>
    </div>
  );
};
