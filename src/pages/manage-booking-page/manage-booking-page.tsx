// pages/manage-booking-page/manage-booking-page.tsx
import { useParams } from "react-router-dom";
import { Layout } from "../../components/layout/layout";
import "./manage-booking-page.css";
import { ReservationHeader } from "../../components/reservation-header/reservation-header";
import { useEffect, useState } from "react";
import { LoginPopUp } from "../../components/login-pop-up/login-pop-up";
import { ClockIcon } from "../../icons/icons";
import { AssistantCard } from "../../components/assistant-card/assistant-card";
import { MoreParticipantsForm } from "../../components/more-participants-form/more-participants-form";
import { Notification } from "../../components/notifications/notification";
import { useNotification } from "../../hooks/useNotification";
import type {
  ReservationDetails,
  Assistant,
  GuestChange,
} from "../../types/types";
import {
  getReservationDetails,
  modifyReservationGuests,
} from "../../controller/manage-booking-page-controller";

export const ManageBookingPage = () => {
  const { venueId, reservationId } = useParams<{
    venueId: string;
    reservationId: string;
  }>();

  const { notifications, showSuccess, showError, removeNotification } =
    useNotification();

  const [reservationData, setReservationData] =
    useState<ReservationDetails | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [isTable, setIsTable] = useState<string>("false");
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [moreParticipants, setMoreParticipants] = useState<boolean>(false);

  const [localAssistants, setLocalAssistants] = useState<Assistant[]>([]);
  const [pendingChanges, setPendingChanges] = useState<GuestChange[]>([]);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  const handleAdminStatusChange = (isAdmin: boolean) => {
    setIsAdmin(isAdmin);
  };

  const generateTempId = () => `temp_${Date.now()}_${Math.random()}`;

  const addPendingChange = (change: GuestChange) => {
    setPendingChanges((prev) => [...prev, change]);
    setHasUnsavedChanges(true);
  };

  const handleRemoveGuest = (guestId: string) => {
    const guest = localAssistants.find((g) => g.id === guestId);
    if (!guest) return;

    if (guest.status === "pending_add") {
      setLocalAssistants((prev) => prev.filter((g) => g.id !== guestId));

      setPendingChanges((prev) =>
        prev.filter(
          (change) =>
            !(change.action === "add" && change.guestName === guest.name)
        )
      );
    } else {
      setLocalAssistants((prev) =>
        prev.map((g) =>
          g.id === guestId ? { ...g, status: "pending_remove" } : g
        )
      );

      addPendingChange({
        action: "delete",
        guestId: guestId,
      });
    }
  };

  const handleRestoreGuest = (guestId: string) => {
    setLocalAssistants((prev) =>
      prev.map((g) => (g.id === guestId ? { ...g, status: "confirmed" } : g))
    );

    setPendingChanges((prev) =>
      prev.filter(
        (change) => !(change.action === "delete" && change.guestId === guestId)
      )
    );

    if (
      pendingChanges.filter(
        (change) => !(change.action === "delete" && change.guestId === guestId)
      ).length === 0
    ) {
      setHasUnsavedChanges(false);
    }
  };

  const handleAddGuests = (guestNames: string[]) => {
    const newGuests: Assistant[] = guestNames.map((name) => ({
      id: generateTempId(),
      name: name.trim(),
      paidAt: null,
      status: "pending_add",
      isRegisteredUser: false,
      isCreator: false,
    }));

    setLocalAssistants((prev) => [...prev, ...newGuests]);

    guestNames.forEach((name) => {
      addPendingChange({
        action: "add",
        guestName: name.trim(),
      });
    });

    showSuccess(
      `${guestNames.length} guest${
        guestNames.length > 1 ? "s" : ""
      } added successfully!`
    );
  };

  const handleSaveChanges = async () => {
    if (pendingChanges.length === 0 || !reservationId) return;

    try {
      setIsSaving(true);

      const response = await modifyReservationGuests(
        reservationId,
        pendingChanges
      );

      if (response.success) {
        setPendingChanges([]);
        setHasUnsavedChanges(false);

        await fetchReservationDetails();

        showSuccess("Changes saved successfully! Waiting for venue approval.");
      }
    } catch (error: any) {
      console.error("Error saving changes:", error);

      let errorMessage = "Error saving changes. Please try again.";

      if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.message) {
        errorMessage = error.message;
      }

      showError(errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelChanges = () => {
    if (reservationData?.assistants) {
      setLocalAssistants([...reservationData.assistants]);
    }
    setPendingChanges([]);
    setHasUnsavedChanges(false);

    // Mostrar notificación de información
    showSuccess("Changes cancelled successfully.");
  };

  const fetchReservationDetails = async () => {
    if (!reservationId) {
      setError("Booking ID is required");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await getReservationDetails(reservationId);

      if (response.success) {
        setReservationData(response.booking);
        setLocalAssistants([...response.booking.assistants]);
        setIsTable(response.booking.type === "table" ? "true" : "false");
      } else {
        setError("Failed to load booking details");
        showError("Failed to load booking details");
      }
    } catch (err: any) {
      console.error("Error fetching booking:", err);
      const errorMessage = "Failed to load booking details";
      setError(errorMessage);
      showError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReservationDetails();
  }, [reservationId]);

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  };

  return (
    <Layout>
      {/* Renderizar notificaciones */}
      {notifications.map((notification) => (
        <Notification
          key={notification.id}
          message={notification.message}
          type={notification.type}
          onClose={() => removeNotification(notification.id)}
        />
      ))}

      {loading ? (
        <div>Loading...</div>
      ) : (
        <>
          {isOpen && (
            <LoginPopUp
              onClose={() => setIsOpen(false)}
              handleAdminStatusChange={handleAdminStatusChange}
            />
          )}

          {moreParticipants && (
            <MoreParticipantsForm
              handleClose={() => setMoreParticipants(false)}
              onAddGuests={handleAddGuests}
            />
          )}

          <div className="manage-booking-page-container">
            {!isAdmin && !isOpen && (
              <button
                className="login-admin-button"
                onClick={() => setIsOpen(true)}
              >
                Login as Admin
              </button>
            )}

            <ReservationHeader
              id={venueId || ""}
              date={reservationData?.startDate.split("T")[0] || ""}
              table={isTable}
              isPaymentPage
              isWithTime
              startTime={
                reservationData ? formatTime(reservationData.startDate) : ""
              }
              endTime={
                reservationData ? formatTime(reservationData.endDate) : ""
              }
            />

            <p className="title-section">Assistants</p>

            <div className="booking-info">
              <div className="assistants">
                {localAssistants.map((assistant) => (
                  <AssistantCard
                    key={assistant.id}
                    data={assistant}
                    isAdmin={isAdmin}
                    onRemove={handleRemoveGuest}
                    onRestore={handleRestoreGuest}
                  />
                ))}

                {isAdmin && (
                  <button
                    className="request-more"
                    onClick={() => setMoreParticipants(true)}
                    disabled={isSaving}
                  >
                    Request more participants
                  </button>
                )}

                {/* Botones de guardar/cancelar cambios */}
                {isAdmin && hasUnsavedChanges && (
                  <div className="save-changes-section">
                    <button
                      className="save-changes-button"
                      onClick={handleSaveChanges}
                      disabled={isSaving}
                    >
                      {isSaving
                        ? "Saving..."
                        : `Save Changes (${pendingChanges.length})`}
                    </button>
                    <button
                      className="cancel-changes-button"
                      onClick={handleCancelChanges}
                      disabled={isSaving}
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>

              <div className="booking-sum-up">
                <p className="booking-sum-up-title">Information</p>
                <p className="info">
                  <ClockIcon strokeColor="white" /> Cancel free ends: 48h before
                </p>
                <div className="total-paid">
                  <p>Total paid</p>
                  <strong>
                    {reservationData?.paymentSummary.totalPaid || 0} Q
                  </strong>
                </div>
                <p className="info">
                  Total:{" "}
                  <strong>
                    {reservationData?.paymentSummary.totalAmount || 0} Q
                  </strong>
                </p>
                <p className="info">
                  Pending:{" "}
                  <strong>
                    {reservationData?.paymentSummary.totalPending || 0} Q
                  </strong>
                </p>
                <div className="progress-bar">
                  <div
                    className="progress-bar-fill"
                    style={{
                      width:
                        (reservationData?.paymentSummary.paymentProgress || 0) +
                        "%",
                    }}
                  />
                  <p>{reservationData?.paymentSummary.paymentProgress || 0}%</p>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </Layout>
  );
};
