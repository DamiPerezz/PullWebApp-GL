import "./venues-page.css";
import { Layout } from "../../components/layout/layout";
import { VenuesCard } from "../../components/venues-card/venues-card";
import { useEffect, useState } from "react";
import type { VenueInfo } from "../../types/types";
import { getAllVenues } from "../../controller/venues-page-controller";
import { SEO } from "../../components/seo/seo";

export const VenuesPage = () => {
  const [venues, setVenues] = useState<VenueInfo[]>([]);
  const [loading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    getAllVenues()
      .then((data) => {
        setVenues(data);
        setIsLoading(false);
      })
      .catch(() => {
        setIsLoading(false);
      });
  }, []);

  return (
    <Layout>
      <SEO
        title="Discotecas y Venues"
        description="Descubre las mejores discotecas, bares y venues de Guatemala. Reserva mesas VIP, compra entradas y vive la mejor vida nocturna guatemalteca."
        keywords="discotecas guatemala, venues guatemala, bares guatemala, antros guatemala, vida nocturna guatemala, clubs nocturnos, reservar mesa vip"
        canonicalUrl="https://web.pullevents.com/venues"
        ogTitle="Mejores Discotecas y Venues en Guatemala"
        ogDescription="Explora las discotecas más exclusivas de Guatemala. Reserva tu mesa VIP y vive noches inolvidables."
      />
      <div className="venues-page-wrapper">
        <div className="venues-page-background" />

        <main className="venues-page-content">
          <section className="venues-title-section">
            <h2 className="venues-main-title">
              Discover <span className="venues-title-gradient">amazing</span> venues
            </h2>
            <p className="venues-subtitle">Explore the best venues in your city</p>
          </section>

          {loading ? (
            <div className="venues-loading">
              <div className="venues-loading-spinner" />
              <p className="venues-loading-text">Loading venues...</p>
            </div>
          ) : venues.length !== 0 ? (
            <section className="venues-grid-container">
              <div className="venues-grid">
                {venues.map((venue) => (
                  <VenuesCard key={venue.id} venue={venue} />
                ))}
              </div>
            </section>
          ) : (
            <div className="venues-empty">
              <p className="venues-empty-text">No venues available at the moment</p>
            </div>
          )}
        </main>
      </div>
    </Layout>
  );
};
