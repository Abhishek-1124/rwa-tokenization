import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useWallet } from '../../hooks/useWallet';
import './Marketplace.css';

interface Asset {
  id: string;
  title: string;
  category: string;
  description: string;
  price: string;
  priceInHBAR: string;
  tokenId: string;
  available: number;
  image: string;
  featured?: boolean;
}

const Marketplace: React.FC = () => {
  const { isConnected } = useWallet();
  const navigate = useNavigate();
  const [currentSlide, setCurrentSlide] = React.useState(0);

  const featuredAssets: Asset[] = [
    {
      id: '1',
      title: 'Chicago House',
      category: 'Real Estate',
      description: 'Modern apartments with panoramic lake views, gym, and rooftop pool.',
      price: '$0.3317',
      priceInHBAR: '3.0000 HBAR',
      tokenId: '#930401966',
      available: 2093,
      image: '/src/assets/chicago-house.jpg',
      featured: true,
    },
    {
      id: '2',
      title: 'Miami Beach Villa',
      category: 'Real Estate',
      description: 'Luxury beachfront property with private pool and ocean views.',
      price: '$0.5250',
      priceInHBAR: '5.0000 HBAR',
      tokenId: '#930401967',
      available: 1500,
      image: '/src/assets/miami-villa.jpg',
      featured: true,
    },
  ];

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % featuredAssets.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + featuredAssets.length) % featuredAssets.length);
  };

  return (
    <div className="marketplace-page">
      {/* Header */}
      <header className="marketplace-header">
        <div className="header-container">
          <div className="logo" onClick={() => navigate('/')}>
            <div className="logo-icon">🏠</div>
            <span className="logo-text">Flagship Designer</span>
          </div>
          <nav className="nav">
            <a href="/" className="nav-link">Explore</a>
            <a href="/dashboard" className="nav-link">About</a>
            <a href="/dashboard" className="nav-link">Help</a>
            {isConnected && (
              <button className="dashboard-btn">
                📊 My Dashboard
              </button>
            )}
          </nav>
        </div>
      </header>

      {/* Featured Section */}
      <section className="featured-section">
        <div className="featured-container">
          <div className="carousel">
            <button className="carousel-btn prev" onClick={prevSlide}>
              ‹
            </button>
            <button className="carousel-btn next" onClick={nextSlide}>
              ›
            </button>

            <div className="carousel-content">
              <div className="carousel-image-section">
                <div className="featured-badge">✨ FEATURED</div>
                <img
                  src={featuredAssets[currentSlide].image}
                  alt={featuredAssets[currentSlide].title}
                  className="carousel-image"
                />
              </div>

              <div className="carousel-details">
                <span className="asset-category">{featuredAssets[currentSlide].category}</span>
                <h1 className="asset-title">{featuredAssets[currentSlide].title}</h1>
                <p className="asset-description">{featuredAssets[currentSlide].description}</p>

                <div className="asset-pricing">
                  <div className="price-main">{featuredAssets[currentSlide].price}</div>
                  <div className="price-sub">
                    Price per token ({featuredAssets[currentSlide].priceInHBAR})
                  </div>
                </div>

                <div className="asset-token-info">
                  <span className="token-id">Token {featuredAssets[currentSlide].tokenId}</span>
                  <span className="token-available">
                    {featuredAssets[currentSlide].available} Available
                  </span>
                </div>

                <div className="asset-actions">
                  <button className="btn-view-details">View Details</button>
                  <button className="btn-invest-now">Invest Now</button>
                </div>
              </div>
            </div>

            <div className="carousel-indicators">
              {featuredAssets.map((_, index) => (
                <button
                  key={index}
                  className={`indicator ${index === currentSlide ? 'active' : ''}`}
                  onClick={() => setCurrentSlide(index)}
                />
              ))}
            </div>
          </div>
        </div>
      </section>


      {/* Footer */}
      <footer className="marketplace-footer">
        <div className="footer-container">
          <div className="footer-badge">
            <div className="badge-icon">⬢</div>
            <div className="badge-text">
              <span className="badge-label">WEB3 COMPATIBLE • HASHGRAPH NETWORK</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Marketplace;
