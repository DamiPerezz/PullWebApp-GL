import { useForm } from "react-hook-form";
import { CloseXIcon } from "../../icons/icons";
import { useState } from "react";
import { useParams } from "react-router-dom";
import "./login-pop-up.css";
import { authenticateBooking } from "../../controller/manage-booking-page-controller";

interface LoginFormData {
  dpi: string;
  password: string;
}

export const LoginPopUp = ({
  onClose,
  handleAdminStatusChange,
}: {
  onClose: () => void;
  handleAdminStatusChange: (isAdmin: boolean) => void;
}) => {
  const { reservationId } = useParams<{ reservationId: string }>();
  const [authError, setAuthError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<LoginFormData>();

  const onSubmit = async (data: LoginFormData) => {
    try {
      if (!reservationId) {
        setAuthError("Reservation ID not found");
        return;
      }

      setAuthError(null); // Reset any previous errors

      const response = await authenticateBooking(reservationId, data);

      if (response.success) {
        // TODO: Store token and user info in sessionStorage or context
        localStorage.setItem("reservationToken", response.token);
        localStorage.setItem(
          "reservationAdmin",
          JSON.stringify({
            name: response.user.name,
            email: response.user.email,
            reservationId: reservationId,
          })
        );

        handleAdminStatusChange(true);

        // Close popup and reset form
        onClose();
        reset();
      } else {
        setAuthError("Authentication failed");
      }
    } catch (error: any) {
      console.error("Error en login:", error);

      // Handle different types of errors
      if (error.response?.status === 401) {
        setAuthError("DPI o contraseña incorrectos");
      } else if (error.response?.status === 404) {
        setAuthError("Reserva no encontrada");
      } else if (error.response?.data?.error) {
        setAuthError(error.response.data.error);
      } else {
        setAuthError("Error de conexión. Intenta nuevamente.");
      }
    }
  };

  return (
    <div className="login-pop-up">
      <div className="login-pop-up-content">
        <h2>Login for manage your reservation</h2>
        <form onSubmit={handleSubmit(onSubmit)}>
          {authError && <div className="auth-error-message">{authError}</div>}
          <div>
            <label htmlFor="dpi">DPI:</label>
            <input
              type="text"
              id="dpi"
              {...register("dpi", {
                required: "El DPI es requerido",
                pattern: {
                  value: /^\d{13}$/,
                  message: "El DPI debe tener exactamente 13 números",
                },
              })}
              placeholder="Ingresa tu DPI (13 dígitos)"
              maxLength={13}
            />
            {errors.dpi && (
              <span className="error-message">{errors.dpi.message}</span>
            )}
          </div>
          <div>
            <label htmlFor="password">Contraseña:</label>
            <input
              type="password"
              id="password"
              {...register("password", {
                required: "La contraseña es requerida",
                minLength: {
                  value: 6,
                  message: "La contraseña debe tener al menos 6 caracteres",
                },
              })}
              placeholder="Ingresa tu contraseña"
            />
            {errors.password && (
              <span className="error-message">{errors.password.message}</span>
            )}
          </div>
          <button
            type="submit"
            disabled={isSubmitting}
            className="submit-button"
          >
            {isSubmitting ? "Iniciando sesión..." : "Iniciar Sesión"}
          </button>
        </form>
        <button className="close-button" onClick={onClose}>
          <CloseXIcon strokeColor="white" />
        </button>
      </div>
    </div>
  );
};
