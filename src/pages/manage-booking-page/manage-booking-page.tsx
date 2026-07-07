// pages/manage-booking-page/manage-booking-page.tsx
// SECURITY: Validate URL parameters to prevent injection
// @ts-nocheck
// TODO: Fix type mismatches in this file
import { useParams } from "react-router-dom";
import { useMemo } from "react";
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
import { validateSlug, validateUUID } from "../../utils/security";
import { useTranslation } from "react-i18next";

export const ManageBookingPage = () => {
  const { t, i18n } = useTranslation('common');
  const { venueId: rawVenueId, reservationId: rawReservationId, lang } = useParams<{
    venueId: string;
    reservationId: string;
    lang: string;
  }>();
  // Language param available for future use
  const _currentLang = lang || i18n.language || 'es';

  // SECURITY: Validate URL parameters
  const venueId = useMemo(() => validateSlug(rawVenueId), [rawVenueId]);
  const reservationId = useMemo(() => validateUUID(rawReservationId), [rawReservationId]);

  const { notifications, showSuccess, showError, removeNotification } =
    useNotification();

  const [reservationData, setReservationData] =
    useState<ReservationDetails | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [_error, setError] = useState<string | null>(null);

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

    showSuccess(t('booking.guestsAdded', { count: guestNames.length }));
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

        showSuccess(t('booking.changesSaved'));
      }
    } catch (error: any) {
      console.error("Error saving changes:", error);

      let errorMessage = t('booking.errorSaving');

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

    showSuccess(t('booking.changesCancelled'));
  };

  const fetchReservationDetails = async () => {
    if (!reservationId) {
      setError(t('booking.bookingIdRequired'));
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
        setError(t('booking.failedToLoad'));
        showError(t('booking.failedToLoad'));
      }
    } catch (err: any) {
      console.error("Error fetching booking:", err);
      const errorMessage = t('booking.failedToLoad');
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
        <div>{t('loading.default')}</div>
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
                {t('booking.loginAsAdmin')}
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

            <p className="title-section">{t('booking.assistants')}</p>

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
                    {t('booking.requestMoreParticipants')}
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
                        ? t('booking.saving')
                        : `${t('booking.saveChanges')} (${pendingChanges.length})`}
                    </button>
                    <button
                      className="cancel-changes-button"
                      onClick={handleCancelChanges}
                      disabled={isSaving}
                    >
                      {t('booking.cancel')}
                    </button>
                  </div>
                )}
              </div>

              <div className="booking-sum-up">
                <p className="booking-sum-up-title">{t('booking.information')}</p>
                <p className="info">
                  <ClockIcon strokeColor="white" /> {t('booking.cancelFreeEnds')}
                </p>
                <div className="total-paid">
                  <p>{t('booking.totalPaid')}</p>
                  <strong>
                    {reservationData?.paymentSummary.totalPaid || 0} Q
                  </strong>
                </div>
                <p className="info">
                  {t('booking.total')}:{" "}
                  <strong>
                    {reservationData?.paymentSummary.totalAmount || 0} Q
                  </strong>
                </p>
                <p className="info">
                  {t('booking.pending')}:{" "}
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
