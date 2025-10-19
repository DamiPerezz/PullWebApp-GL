import { NavLink, useLocation } from 'react-router-dom';
import './nav-bar.css';

import PullLogo from '../../assets/logo.svg'

export const NavBar = () => {

    const location = useLocation();

    const getPageNumber = () => {
        switch (location.pathname) {
            case '/venues':
                return 0;
            case '/events':
                return 1;
            case '/wallet':
                return 2;
            case '/aboutUs':
                return 3;
            case '/signIn':
                return 4;
            default:
                return -1;
        }
    }

    return (
        <nav>
            <div className="nav-content">
                <NavLink to={"/home"}><img src={PullLogo} alt='Pull logo' height={40} /></NavLink>
                <div className="nav-options">
                    <NavLink to={"/venues"} end className={getPageNumber() === 0 ? 'active' : ''}>Venues</NavLink>
                    <NavLink to={"/events"} end className={getPageNumber() === 1 ? 'active' : ''}>Events</NavLink>
                    <NavLink to={"/wallet"} end className={getPageNumber() === 2 ? 'active' : ''}>Wallet</NavLink>
                    <NavLink to={"/aboutUs"} end className={getPageNumber() === 3 ? 'active' : ''}>About Us</NavLink>
                </div>
                <div className="profile-settings">
                    <NavLink to={"/signIn"} className={getPageNumber() === 4 ? 'active' : ''}>Sign In</NavLink>
                </div>
            </div>
        </nav>
    )
}