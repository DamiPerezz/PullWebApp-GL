import { InstagramIcon, TikTokIcon, XBrandIcon } from '../../icons/icons'
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
                        <span>&bull;</span>
                        <a href="/privacy">Privacy</a>
                        <span>&bull;</span>
                        <a href="/terms">Terms</a>
                        <span>&bull;</span>
                        <a href="/cookies">Cookies</a>
                    </div>
                </div>

                <div className="social-media">
                    <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" aria-label="Instagram">
                        <InstagramIcon strokeColor="rgba(255, 255, 255, 0.6)" />
                    </a>
                    <a href="https://tiktok.com" target="_blank" rel="noopener noreferrer" aria-label="TikTok">
                        <TikTokIcon strokeColor="rgba(255, 255, 255, 0.6)" />
                    </a>
                    <a href="https://x.com" target="_blank" rel="noopener noreferrer" aria-label="X">
                        <XBrandIcon strokeColor="rgba(255, 255, 255, 0.6)" />
                    </a>
                </div>
            </div>
        </footer>
    )
}