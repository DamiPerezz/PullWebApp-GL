import { Footer } from '../footer/footer.tsx'
import { VenueNavBar } from '../venue-nav-bar/venue-nav-bar.tsx'
import './layout.css'

export const Layout = ({ children }: { children: React.ReactNode }) => {
    return (
        <div className='layout-container'>
            <VenueNavBar />
            <main className='layout-content'>
                {children}
            </main>
            <Footer />
        </div>
    )
}