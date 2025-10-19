import { Footer } from '../footer/footer.tsx'
import { NavBar } from '../nav-bar/nav-bar.tsx'
import './layout.css'

export const Layout = ({ children }: { children: React.ReactNode }) => {
    return (
        <div className='layout-container'>
            <NavBar />
            {children}
            <Footer />
        </div>
    )
}