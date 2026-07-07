// components/guest-list-card/guest-list-card.tsx
import { NavLink, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowRight, ClipboardList, Users, UserCheck, UserPlus, XCircle } from 'lucide-react';
import './guest-list-card.css';
import type { GuestListType } from '../../types/types';

interface GuestListCardProps {
    guestList: GuestListType;
    eventSlug: string;
}

export const GuestListCard = ({ guestList, eventSlug }: GuestListCardProps) => {
    const { t } = useTranslation('guestList');
    const { lang } = useParams<{ lang: string }>();
    const currentLang = lang || 'es';

    const availableSpots = guestList.max_capacity
        ? guestList.max_capacity - guestList.current_count
        : null;

    const isFull = availableSpots !== null && availableSpots <= 0;

    const getGenderRestrictionLabel = () => {
        if (!guestList.allowed_gender) return null;
        if (guestList.allowed_gender === 'male') return t('card.maleOnly');
        if (guestList.allowed_gender === 'female') return t('card.femaleOnly');
        return null;
    };

    const genderLabel = getGenderRestrictionLabel();

    if (isFull) {
        return (
            <div className="guest-list-card guest-list-card-full">
                <div className="guest-list-card-header">
                    <div className="guest-list-card-title-wrapper">
                        <ClipboardList className="guest-list-icon" />
                        <h3 className="guest-list-card-title">{guestList.name}</h3>
                    </div>
                    <div className="guest-list-card-badges">
                        <span className="guest-list-badge-free">{t('card.free')}</span>
                    </div>
                </div>

                {guestList.description && (
                    <p className="guest-list-card-description">{guestList.description}</p>
                )}

                <div className="guest-list-card-footer">
                    <div className="guest-list-card-info">
                        <Users size={16} />
                        <span>{t('card.full')}</span>
                    </div>
                    <div className="guest-list-card-button-disabled">
                        <XCircle size={16} />
                        {t('card.full')}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <NavLink
            to={`/${currentLang}/event/${eventSlug}/list/${guestList.id}`}
            className="guest-list-card"
        >
            <div className="guest-list-card-header">
                <div className="guest-list-card-title-wrapper">
                    <ClipboardList className="guest-list-icon" />
                    <h3 className="guest-list-card-title">{guestList.name}</h3>
                </div>
                <div className="guest-list-card-badges">
                    <span className="guest-list-badge-free">{t('card.free')}</span>
                    {genderLabel && (
                        <span className="guest-list-badge-gender">
                            <UserCheck size={12} />
                            {genderLabel}
                        </span>
                    )}
                </div>
            </div>

            {guestList.description && (
                <p className="guest-list-card-description">{guestList.description}</p>
            )}

            <div className="guest-list-card-footer">
                {availableSpots !== null && (
                    <div className="guest-list-card-spots">
                        <Users size={16} />
                        <span>{t('card.spots', { available: availableSpots })}</span>
                    </div>
                )}
                <div className="guest-list-card-button">
                    <UserPlus size={16} />
                    {t('card.signUp')}
                    <ArrowRight size={16} />
                </div>
            </div>
        </NavLink>
    );
};
