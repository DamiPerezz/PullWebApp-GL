import QRCode from "react-qr-code"
import './qr-card.css'
import type { PurchasedTicketInfo } from "../../types/types"

export const QrCard = ({ info }: { info: PurchasedTicketInfo }) => {

    return (
        <div className="qr-card-container">
            <div className="personal-info">
                <p className="name">{info.owner_full_name}</p>
                <p className="email">{info.owner_email}</p>
                <p className="description">{info.benefits}</p>
            </div>
            <div className="qr-wrapper">
                <QRCode value={info.qr_token} size={100} bgColor="black" fgColor="white" />
            </div>
        </div>
    )
}