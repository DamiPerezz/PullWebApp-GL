import { AddUserIcon, CreditCardIcon, DeleteUserIcon } from "../../icons/icons";
import "./assistant-card.css";

export const AssistantCard = ({
  data,
  isAdmin,
  onRemove,
  onRestore,
}: {
  data: {
    id: string;
    name: string;
    paidAt: string | null;
    status: string;
    email?: string;
    isRegisteredUser: boolean;
    isCreator?: boolean;
  };
  isAdmin: boolean;
  onRemove?: (id: string) => void;
  onRestore?: (id: string) => void;
}) => {
  const isPendingRemove = data.status === "pending_remove";
  const isPendingAdd = data.status === "pending_add";
  const isAccepted = data.status === "confirmed";
  const isUnpaid = isAccepted && data.paidAt === null;

  const cardClass = isPendingAdd
    ? "pending_add"
    : isPendingRemove
    ? "pending_remove"
    : isUnpaid
    ? "unpaid"
    : data.status;

  return (
    <div className={`assistant-card ${cardClass}`} data-status={data.status}>
      <div className="assistant-name-section">
        <p>{data.name}</p>

        {isPendingAdd && (
          <span className="status-badge pending-add">Pending Add</span>
        )}

        {isPendingRemove && (
          <span className="status-badge pending-remove">Pending Remove</span>
        )}

        {isAccepted && data.paidAt === null && (
          <span className="status-badge unpaid">To Pay</span>
        )}
      </div>

      <div className="options">
        {isAdmin && !data.isCreator && (
          <>
            {(isAccepted || isPendingAdd) && (
              <button
                className="delete"
                onClick={() => onRemove?.(data.id)}
                title={isPendingAdd ? "Cancel addition" : "Mark for removal"}
              >
                <DeleteUserIcon strokeColor="white" />
              </button>
            )}

            {isPendingRemove && (
              <button
                className="restore"
                onClick={() => onRestore?.(data.id)}
                title="Cancel removal"
              >
                <AddUserIcon strokeColor="white" />
              </button>
            )}
          </>
        )}

        {isAccepted && (
          <>
            {data.paidAt === null ? (
              <div className="payment-container unpaid-status">
                <CreditCardIcon strokeColor="white" />
              </div>
            ) : (
              <div className="payment-container paid-status">
                <CreditCardIcon strokeColor="#4c9b78" />
              </div>
            )}
          </>
        )}

        {(isPendingAdd || isPendingRemove) && !isAdmin && (
          <div
            className={`status-container ${
              isPendingAdd ? "pending-add-status" : "pending-remove-status"
            }`}
          >
            {isPendingAdd ? (
              <AddUserIcon strokeColor="white" />
            ) : (
              <DeleteUserIcon strokeColor="white" />
            )}
          </div>
        )}
      </div>
    </div>
  );
};
