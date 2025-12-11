import { Link } from 'react-router-dom'
import { InstagramIcon, TikTokIcon, LinkedInIcon } from '../../icons/icons'
import './footer.css'

export const Footer = () => {
    const currentYear = new Date().getFullYear();

    return (
        <footer>
            <div className="footer-content">
                <div className="footer-left">
                    <p className="footer-copyright">
                        © {currentYear} Pull
                    </p>
                    <div className="important-documents">
                        <span>•</span>
                        <Link to="/privacy">Privacy</Link>
                        <span>•</span>
                        <Link to="/terms">Terms</Link>
                        <span>•</span>
                        <Link to="/cookie-policy">Cookies</Link>
                    </div>
                </div>

                <div className="social-media">
                    <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" aria-label="Instagram">
                        <InstagramIcon strokeColor="currentColor" />
                    </a>
                    <span className="social-media-separator">•</span>
                    <a href="https://tiktok.com" target="_blank" rel="noopener noreferrer" aria-label="TikTok">
                        <TikTokIcon strokeColor="currentColor" />
                    </a>
                    <span className="social-media-separator">•</span>
                    <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn">
                        <LinkedInIcon strokeColor="currentColor" />
                    </a>
                </div>
            </div>
        </footer>
    )
}