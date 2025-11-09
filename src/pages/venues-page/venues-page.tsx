import "./venues-page.css";
import { Layout } from "../../components/layout/layout";
import { VenuesCard } from "../../components/venues-card/venues-card";
import { useEffect, useState } from "react";
import type { VenueInfo } from "../../types/types";
import { getAllVenues } from "../../controller/venues-page-controller";

export const VenuesPage = () => {
  const [venues, setVenues] = useState<VenueInfo[]>([]);
  const [loading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    getAllVenues()
      .then((data) => {
        setVenues(data);
        setIsLoading(false);
      })
      .catch((error) => {
        console.error("Error fetching venues:", error);
        setIsLoading(false);
      });
  }, []);

  return (
    <Layout>
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
