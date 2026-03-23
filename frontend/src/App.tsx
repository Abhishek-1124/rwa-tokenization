import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { WalletProvider } from './context/Web3Context';
import { AuthProvider } from './context/AuthContext';
import Home from './pages/Home/Home';
import Admin from './pages/Admin/Admin';
import Dashboard from './pages/Dashboard/Dashboard';
import Issuer from './pages/Issuer/Issuer';
import Marketplace from './pages/Marketplace/Marketplace';

function App() {
  return (
    <BrowserRouter>
      <WalletProvider>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/marketplace" element={<Marketplace />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="/issuer" element={<Issuer />} />
            <Route path="/marketplace" element={<Marketplace />} />
          </Routes>
        </AuthProvider>
      </WalletProvider>
    </BrowserRouter>
  );
}

export default App;
