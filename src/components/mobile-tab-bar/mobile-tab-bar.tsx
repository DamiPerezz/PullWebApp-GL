import { NavLink, useParams } from "react-router-dom";
import { Home, Wallet, User } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import "./mobile-tab-bar.css";

export const MobileTabBar = () => {
  const { lang } = useParams();
  const { isAuthenticated } = useAuth();
  const currentLang = lang || 'es';

  const buildUrl = (path: string) => `/${currentLang}${path}`;

  return (
    <nav className="mobile-tab-bar">
      <NavLink
        to={buildUrl("/venues/aurora-hall/events")}
        className={({ isActive }) =>
          `mobile-tab-bar__item ${isActive ? "mobile-tab-bar__item--active" : ""}`
        }
      >
        <Home size={18} />
        <span>Inicio</span>
      </NavLink>

      <NavLink
        to={isAuthenticated ? buildUrl("/wallet") : buildUrl("/login")}
        className={({ isActive }) =>
          `mobile-tab-bar__item ${isActive ? "mobile-tab-bar__item--active" : ""}`
        }
      >
        <Wallet size={18} />
        <span>Wallet</span>
      </NavLink>

      <NavLink
        to={buildUrl("/login")}
        className={({ isActive }) =>
          `mobile-tab-bar__item ${isActive ? "mobile-tab-bar__item--active" : ""}`
        }
      >
        <User size={18} />
        <span>Perfil</span>
      </NavLink>
    </nav>
  );
};
