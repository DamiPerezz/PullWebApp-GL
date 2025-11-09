export const InfoComponent = ({ icon, text }: { icon: any, text: string }) => {
    return (
        <p className="event-card-detail-item">
            {icon}
            <span>{text}</span>
        </p>
    )
}