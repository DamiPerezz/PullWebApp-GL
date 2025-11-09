import { useNavigate } from 'react-router-dom';
import { Layout } from '../../components/layout/layout';
import './not-found-page.css';

const HomeIcon = () => (
    <svg 
        width="20" 
        height="20" 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="2" 
        strokeLinecap="round" 
        strokeLinejoin="round"
    >
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
);

export const NotFoundPage = () => {
    const navigate = useNavigate();

    const handleGoHome = () => {
        navigate('/venues');
    };

    return (
        <Layout>
            <div className="not-found-container">
                <div className="not-found-content">
                    <div className="error-code">404</div>
                    
                    <h1 className="error-title">Page Not Found</h1>
                    
                    <p className="error-description">
                        The page you're looking for doesn't exist or has been moved.
                    </p>
                    
                    <button 
                        className="back-home-button" 
                        onClick={handleGoHome}
                    >
                        <HomeIcon />
                        <span>Back to Home</span>
                    </button>
                </div>
            </div>
        </Layout>
    );
};