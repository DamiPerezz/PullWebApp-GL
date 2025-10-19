import './venues-page.css'
import { Layout } from "../../components/layout/layout"
import { VenuesCard } from '../../components/venues-card/venues-card';
import { useEffect, useState } from 'react';
import type { VenueInfo } from '../../types/types';
import { getAllVenues } from '../../controller/venues-page-controller';

export const VenuesPage = () => {

    const [venues, setVenues] = useState<VenueInfo[]>([]);
    const [loading, setIsLoading] = useState<boolean>(true);

    useEffect(() => {
        getAllVenues().then(
            (data) => {
                setVenues(data);
                setIsLoading(false);
            }
        ).catch((error) => {
            console.error('Error fetching venues:', error);
            setIsLoading(false);
        })
    }, [])

    return (
        <Layout>
            <div className="venues-container">
                <h2>Choose a <span className="gradient-word">venue</span></h2>
                
                {venues.length !== 0 && !loading ?
                    venues.map((venue) => (
                        <VenuesCard key={venue.id} venue={venue} />
                    )) : venues.length === 0 ? <p>No venues available</p> : <p>Searching venues...</p>}
            </div>
        </Layout>
    )
}