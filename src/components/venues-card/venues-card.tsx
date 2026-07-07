import { NavLink, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ClockIcon, LocationIcon } from "../../icons/icons";
import "./venues-card.css";
import type { VenueInfo } from "../../types/types";
import { ArrowRight, Calendar } from "lucide-react";

export const VenuesCard = ({ venue }: { venue: VenueInfo }) => {
  const { t, i18n } = useTranslation('common');
  const { lang } = useParams<{ lang: string }>();
  const currentLang = lang || i18n.language || 'es';

  const open = venue.open_time.slice(0, 5);
  const close = venue.close_time.slice(0, 5);

  return (
    <NavLink
      to={`/${currentLang}/venues/${venue.slug}/events`}
      className="venues-card-container"
    >
      <div className="venues-card-inner">
        <div className="venues-card-bg-gradient" />

        <div className="venues-card-content">
          <div className="venues-card-image-wrapper">
            <img
              src={venue.image}
              alt={venue.venue_name}
              className="venues-card-image"
              loading="lazy"
            />
          </div>

          <div className="venues-card-info">
            <div>
              <h3 className="venues-card-title">{venue.venue_name}</h3>

              <div className="venues-card-details">
                <p className="venues-card-detail-item">
                  <ClockIcon
                    strokeColor="rgb(59, 130, 246)"
                    className="icon-clock"
                  />
                  <span>
                    {open} - {close}
                  </span>
                </p>

                <p className="venues-card-detail-item">
                  <LocationIcon
                    strokeColor="rgb(52, 211, 153)"
                    className="icon-location"
                  />
                  <span>{venue.location}</span>
                </p>
              </div>
            </div>

            <div className="venues-card-footer">
              <div className="venues-card-footer-info">
                <Calendar />
                <span className="venues-card-footer-text">
                  {t('venue.viewUpcoming')}
                </span>
              </div>
              <div className="venues-card-button">
                <span>{t('venue.viewEvents')}</span>
                <ArrowRight />
              </div>
            </div>
          </div>
        </div>
      </div>
    </NavLink>
  );
};
