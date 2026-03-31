import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useWallet } from '../../hooks/useWallet';
import { useMarketplaceContract, type Listing, type Offer } from '../../hooks/useMarketplaceContract';
import { useContractAddresses } from '../../hooks/useContractAddresses';
import '../UserTools/UserTools.css';

type ListingRow = {
  id: number;
  data: Listing;
};

type OfferRow = {
  id: number;
  data: Offer;
};

const Transactions: React.FC = () => {
  const navigate = useNavigate();
  const { isConnected } = useWallet();
  const { addresses } = useContractAddresses();
  const marketplace = useMarketplaceContract();

  const [listings, setListings] = React.useState<ListingRow[]>([]);
  const [offers, setOffers] = React.useState<OfferRow[]>([]);
  const [error, setError] = React.useState('');
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    if (!isConnected) {
      navigate('/');
    }
  }, [isConnected, navigate]);

  const loadMarketActivity = React.useCallback(async () => {
    if (!addresses.marketplace) {
      setError('Marketplace address is not configured. Set it in Admin first.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const [listingCount, offerCount] = await Promise.all([
        marketplace.listingCount(),
        marketplace.offerCount(),
      ]);

      const listingTotal = Number(listingCount);
      const offerTotal = Number(offerCount);

      const listingIds = Array.from(
        { length: Math.min(8, listingTotal) },
        (_, index) => listingTotal - index,
      ).filter((id) => id > 0);

      const offerIds = Array.from(
        { length: Math.min(8, offerTotal) },
        (_, index) => offerTotal - index,
      ).filter((id) => id > 0);

      const listingData = await Promise.all(
        listingIds.map(async (id) => ({ id, data: await marketplace.getListing(id) })),
      );

      const offerData = await Promise.all(
        offerIds.map(async (id) => ({ id, data: await marketplace.getOffer(id) })),
      );

      setListings(
        listingData
          .filter((entry): entry is { id: number; data: Listing } => entry.data !== null),
      );

      setOffers(
        offerData
          .filter((entry): entry is { id: number; data: Offer } => entry.data !== null),
      );
    } catch (e) {
      console.error(e);
      setError('Failed to fetch marketplace history. Verify contract address and network.');
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    if (isConnected) {
      loadMarketActivity();
    }
  }, [isConnected, loadMarketActivity]);

  return (
    <div className="user-tools-page">
      <header className="user-tools-header">
        <div className="user-tools-header-container">
          <h1 className="user-tools-title">Transactions</h1>
          <div className="user-tools-nav">
            <button onClick={() => navigate('/dashboard')}>Back to Dashboard</button>
          </div>
        </div>
      </header>

      <main className="user-tools-main">
        <section className="user-tools-card">
          <h2>Marketplace Activity</h2>
          <div className="user-tools-actions">
            <button onClick={loadMarketActivity} disabled={loading}>
              {loading ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>

          {error && <p className="tool-error">{error}</p>}

          <div className="tool-grid" style={{ marginTop: '16px' }}>
            <div className="tool-stat">
              <span className="tool-label">Recent Listings Loaded</span>
              <span className="tool-value">{listings.length}</span>
            </div>
            <div className="tool-stat">
              <span className="tool-label">Recent Offers Loaded</span>
              <span className="tool-value">{offers.length}</span>
            </div>
          </div>

          <div className="tool-list">
            {listings.map((entry) => (
              <div key={`listing-${entry.id}`} className="tool-list-item">
                <p className="tool-list-title">Listing #{entry.id} - Asset {entry.data.assetId.toString()}</p>
                <p className="tool-list-sub">
                  Seller {entry.data.seller} | Remaining {entry.data.amountRemaining.toString()} | Price/Unit {entry.data.pricePerUnit.toString()} wei | {entry.data.active ? 'Active' : 'Closed'}
                </p>
              </div>
            ))}

            {offers.map((entry) => (
              <div key={`offer-${entry.id}`} className="tool-list-item">
                <p className="tool-list-title">Offer #{entry.id} - Listing {entry.data.listingId.toString()}</p>
                <p className="tool-list-sub">
                  Bidder {entry.data.bidder} | Amount {entry.data.amount.toString()} | Price/Unit {entry.data.pricePerUnit.toString()} wei | {entry.data.active ? 'Active' : 'Closed'}
                </p>
              </div>
            ))}

            {!loading && listings.length === 0 && offers.length === 0 && !error && (
              <p className="tool-note">No marketplace records were found yet.</p>
            )}
          </div>
        </section>
      </main>
    </div>
  );
};

export default Transactions;