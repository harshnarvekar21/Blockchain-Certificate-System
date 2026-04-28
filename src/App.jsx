import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { ShieldCheck, Wallet, AlertTriangle } from 'lucide-react';
import InstitutionPortal from './components/InstitutionPortal';
import VerifierPortal from './components/VerifierPortal';
import CandidateDashboard from './components/CandidateDashboard';

import BlockCertArtifact from './contracts/BlockCert.json';
import contractAddress from './contracts/contract-address.json';

function App() {
  const [activeTab, setActiveTab] = useState('verify'); // 'verify', 'issue', 'dashboard'
  const [account, setAccount] = useState(null);
  const [contract, setContract] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [error, setError] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);

  useEffect(() => {
    // Check if wallet is already connected
    checkIfWalletIsConnected();
    
    // Listen for account changes
    if (window.ethereum) {
      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', () => window.location.reload());
    }
    
    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
      }
    }
  }, []);

  const handleAccountsChanged = async (accounts) => {
    if (accounts.length > 0) {
      setAccount(accounts[0]);
      await setupContract(accounts[0]);
    } else {
      setAccount(null);
      setContract(null);
      setIsAdmin(false);
    }
  };

  const checkIfWalletIsConnected = async () => {
    if (!window.ethereum) return;
    try {
      const accounts = await window.ethereum.request({ method: 'eth_accounts' });
      if (accounts.length > 0) {
        setAccount(accounts[0]);
        await setupContract(accounts[0], true);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const connectWallet = async () => {
    if (!window.ethereum) {
      // Fallback to Local Hardhat Node if MetaMask is missing
      connectLocalNode();
      return;
    }

    try {
      setIsConnecting(true);
      setError('');
      
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      setAccount(accounts[0]);
      await setupContract(accounts[0], true);
    } catch (err) {
      console.error(err);
      setError("Failed to connect wallet. " + (err.message || ''));
    } finally {
      setIsConnecting(false);
    }
  };

  const connectLocalNode = async () => {
    try {
      setIsConnecting(true);
      setError('');
      
      const provider = new ethers.JsonRpcProvider("http://127.0.0.1:8545");
      // Use Hardhat's default Account #0 private key for Demo/Admin
      const privateKey = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";
      const signer = new ethers.Wallet(privateKey, provider);
      
      setAccount(signer.address);
      await setupContract(signer.address, false, signer);
      
    } catch (err) {
      console.error(err);
      setError("Failed to connect to local Hardhat node. Please ensure it is running.");
    } finally {
      setIsConnecting(false);
    }
  };

  const setupContract = async (userAccount, isMetaMask = true, customSigner = null) => {
    try {
      let signer;
      if (isMetaMask) {
        const provider = new ethers.BrowserProvider(window.ethereum);
        signer = await provider.getSigner();
      } else {
        signer = customSigner;
      }
      
      const blockCertContract = new ethers.Contract(
        contractAddress.BlockCert,
        BlockCertArtifact.abi,
        signer
      );

      setContract(blockCertContract);

      // Check if current user is admin
      const adminAddress = await blockCertContract.admin();
      setIsAdmin(adminAddress.toLowerCase() === userAccount.toLowerCase());
      
    } catch (err) {
      console.error("Error setting up contract:", err);
    }
  };

  return (
    <>
      <div className="bg-blobs">
        <div className="blob blob-1"></div>
        <div className="blob blob-2"></div>
      </div>

      <div className="container">
        <header className="header">
          <div className="logo">
            <div className="logo-icon">
              <ShieldCheck color="white" size={24} />
            </div>
            <span className="text-gradient">BlockCert</span>
          </div>

          <div>
            {account ? (
              <button className="btn btn-glass" style={{ borderRadius: '50px' }}>
                <Wallet size={18} color="var(--accent-primary)" />
                {account.substring(0, 6)}...{account.substring(account.length - 4)}
                {isAdmin && <span style={{ marginLeft: '8px', background: 'var(--accent-primary)', color: 'white', padding: '2px 8px', borderRadius: '12px', fontSize: '0.75rem' }}>Admin</span>}
              </button>
            ) : (
              <button className="btn btn-primary" onClick={connectWallet} disabled={isConnecting}>
                <Wallet size={18} />
                {isConnecting ? 'Connecting...' : 'Connect MetaMask / Demo'}
              </button>
            )}
          </div>
        </header>

        <main style={{ maxWidth: '800px', margin: '0 auto', paddingBottom: '4rem' }}>
          <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <h1 style={{ fontSize: '3rem', marginBottom: '1rem', letterSpacing: '-1px' }}>
              Decentralized <span className="text-gradient-accent">Trust</span>.
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem', lineHeight: '1.6', maxWidth: '600px', margin: '0 auto' }}>
              An immutable, blockchain-based verification system. Cryptographic proofs ensure your credentials can never be forged or tampered with.
            </p>
          </div>

          {error && (
            <div className="glass-card" style={{ padding: '1rem 1.5rem', marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.75rem', borderLeft: '4px solid #ef4444' }}>
              <AlertTriangle color="#ef4444" />
              <p>{error}</p>
            </div>
          )}

          <div className="tabs" style={{ marginBottom: '2rem' }}>
            <div 
              className={`tab ${activeTab === 'verify' ? 'active' : ''}`}
              onClick={() => setActiveTab('verify')}
            >
              Verifier Portal
            </div>
            <div 
              className={`tab ${activeTab === 'dashboard' ? 'active' : ''}`}
              onClick={() => setActiveTab('dashboard')}
            >
              Candidate Dashboard
            </div>
            {isAdmin && (
              <div 
                className={`tab ${activeTab === 'issue' ? 'active' : ''}`}
                onClick={() => setActiveTab('issue')}
              >
                Institution Portal
              </div>
            )}
          </div>

          {!account && activeTab !== 'verify' && (
            <div className="glass-card" style={{ textAlign: 'center', padding: '3rem 2rem' }}>
              <Wallet size={48} color="var(--text-muted)" style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
              <h3 style={{ marginBottom: '0.5rem' }}>Wallet Connection Required</h3>
              <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
                Please connect MetaMask (or fall back to local Demo Node) to access this portal.
              </p>
              <button className="btn btn-primary" onClick={connectWallet}>
                Connect Wallet (Demo Mode)
              </button>
            </div>
          )}

          <div style={{ animation: 'slideUp 0.3s ease-out' }}>
            {activeTab === 'verify' && <VerifierPortal contract={contract} />}
            {activeTab === 'dashboard' && account && <CandidateDashboard contract={contract} />}
            {activeTab === 'issue' && account && isAdmin && <InstitutionPortal contract={contract} />}
          </div>
        </main>
      </div>
    </>
  );
}

export default App;
