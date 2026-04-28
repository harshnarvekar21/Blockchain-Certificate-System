import { useState } from 'react';
import { Search, ExternalLink, QrCode as QrCodeIcon, Loader2 } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

export default function CandidateDashboard({ contract }) {
  const [uid, setUid] = useState('');
  const [status, setStatus] = useState('idle'); // idle, searching, found, empty
  const [certificates, setCertificates] = useState([]);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!uid || !contract) return;

    try {
      setStatus('searching');
      const hashes = await contract.getHashesByUID(uid);
      
      if (hashes.length === 0) {
        setStatus('empty');
        setCertificates([]);
        return;
      }

      const certsData = [];
      for (const hash of hashes) {
        const cert = await contract.verifyCertificate(hash);
        // cert returns [exists, isValid, timestamp, issuer, uid, ipfsCID]
        certsData.push({
          hash,
          exists: cert[0],
          isValid: cert[1],
          timestamp: new Date(Number(cert[2]) * 1000).toLocaleString(),
          issuer: cert[3],
          ipfsCID: cert[5]
        });
      }
      
      setCertificates(certsData);
      setStatus('found');
    } catch (err) {
      console.error(err);
      setStatus('empty');
    }
  };

  return (
    <div className="glass-card" style={{ padding: '2rem' }}>
      <h2 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        Digital Locker
      </h2>
      <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>
        Enter your unique Student ID (UID) to access and share your authenticated certificates.
      </p>

      <form onSubmit={handleSearch} style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem' }}>
        <input 
          className="input-field" 
          placeholder="Enter your UID..." 
          value={uid}
          onChange={(e) => setUid(e.target.value)}
          style={{ flex: 1 }}
        />
        <button type="submit" className="btn btn-primary" disabled={status === 'searching' || !uid}>
          {status === 'searching' ? <Loader2 className="spinner" size={20} /> : <Search size={20} />}
          Search
        </button>
      </form>

      {status === 'empty' && (
        <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
          No certificates found for this UID.
        </div>
      )}

      {status === 'found' && (
        <div style={{ display: 'grid', gap: '1.5rem' }}>
          {certificates.map((cert, index) => (
            <div key={index} className="result-card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', borderLeft: cert.isValid ? '4px solid #10b981' : '4px solid #ef4444' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h3 style={{ margin: '0 0 0.5rem 0' }}>Certificate #{index + 1}</h3>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '0.25rem' }}>
                    <strong>Issued On:</strong> {cert.timestamp}
                  </div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '0.25rem' }}>
                    <strong>Status:</strong> {cert.isValid ? <span style={{ color: '#10b981' }}>Valid</span> : <span style={{ color: '#ef4444' }}>Revoked</span>}
                  </div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                    <strong>Issuer:</strong> {cert.issuer.substring(0, 6)}...{cert.issuer.substring(cert.issuer.length - 4)}
                  </div>
                </div>
                
                {/* QR Code for easy verification */}
                <div style={{ background: 'white', padding: '0.5rem', borderRadius: '8px' }}>
                  <QRCodeSVG value={cert.hash} size={80} />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                <button 
                  className="btn btn-glass" 
                  style={{ flex: 1, padding: '0.5rem', fontSize: '0.9rem' }}
                  onClick={() => alert(`IPFS Link: ${cert.ipfsCID}\n(In production, this would open the IPFS gateway)`)}
                >
                  <ExternalLink size={16} /> View Document
                </button>
                <button 
                  className="btn btn-glass" 
                  style={{ flex: 1, padding: '0.5rem', fontSize: '0.9rem' }}
                  onClick={() => {
                    navigator.clipboard.writeText(cert.hash);
                    alert("Verification Hash copied to clipboard!");
                  }}
                >
                  <QrCodeIcon size={16} /> Copy Verification Hash
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
