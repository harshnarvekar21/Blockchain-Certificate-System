import { useState, useEffect } from 'react';
import { UploadCloud, CheckCircle, AlertCircle, Loader2, QrCode, Search, FileText } from 'lucide-react';
import { calculateFileHash } from '../utils/crypto';
import { Html5QrcodeScanner } from 'html5-qrcode';

export default function VerifierPortal({ contract }) {
  const [file, setFile] = useState(null);
  const [hashInput, setHashInput] = useState('');
  const [status, setStatus] = useState('idle'); // idle, verifying, authentic, tampered
  const [result, setResult] = useState(null);
  const [showScanner, setShowScanner] = useState(false);

  useEffect(() => {
    if (showScanner) {
      const scanner = new Html5QrcodeScanner('reader', { qrbox: { width: 250, height: 250 }, fps: 5 }, false);
      scanner.render(
        (decodedText) => {
          scanner.clear();
          setShowScanner(false);
          setHashInput(decodedText);
          verifyHash(decodedText);
        },
        (err) => { /* ignore scanning errors */ }
      );
      return () => {
        scanner.clear().catch(console.error);
      };
    }
  }, [showScanner]);

  const handleFileChange = async (e) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      setStatus('verifying');
      
      try {
        const hash = await calculateFileHash(selectedFile);
        setHashInput(hash);
        await verifyHash(hash);
      } catch (err) {
        setStatus('tampered');
      }
    }
  };

  const handleManualVerify = (e) => {
    e.preventDefault();
    if (hashInput) {
      verifyHash(hashInput);
    }
  };

  const verifyHash = async (hash) => {
    if (!contract) return;
    setStatus('verifying');
    
    try {
      const cert = await contract.verifyCertificate(hash);
      // cert returns [exists, isValid, timestamp, issuer, uid, ipfsCID]
      if (cert[0] && cert[1]) {
        setStatus('authentic');
        setResult({
          timestamp: new Date(Number(cert[2]) * 1000).toLocaleString(),
          issuer: cert[3],
          uid: cert[4],
          ipfsCID: cert[5]
        });
      } else if (cert[0] && !cert[1]) {
        // Exists but revoked
        setStatus('revoked');
      } else {
        setStatus('tampered');
      }
    } catch (err) {
      console.error(err);
      setStatus('tampered');
    }
  };

  return (
    <div style={{ display: 'grid', gap: '2rem' }}>
      <div className="glass-card" style={{ padding: '2rem' }}>
        <h2 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Search /> Verify Certificate
        </h2>

        <div style={{ display: 'grid', gap: '1.5rem', marginBottom: '2rem' }}>
          <form onSubmit={handleManualVerify} style={{ display: 'flex', gap: '0.5rem' }}>
            <input 
              className="input-field" 
              placeholder="Enter Document Hash or Scan QR" 
              value={hashInput}
              onChange={(e) => setHashInput(e.target.value)}
              style={{ flex: 1 }}
            />
            <button type="submit" className="btn btn-primary" disabled={status === 'verifying'}>
              Verify
            </button>
            <button type="button" className="btn btn-glass" onClick={() => setShowScanner(!showScanner)}>
              <QrCode size={20} />
            </button>
          </form>

          {showScanner && <div id="reader" style={{ width: '100%', maxWidth: '400px', margin: '0 auto' }}></div>}

          <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>OR</div>

          <div 
            className="file-drop-zone"
            onClick={() => document.getElementById('verifyFileInput').click()}
          >
            <UploadCloud className="file-drop-icon" />
            {file ? (
              <p style={{ color: 'var(--text-main)', fontWeight: '600' }}>{file.name}</p>
            ) : (
              <p>Upload PDF Document</p>
            )}
            <input type="file" id="verifyFileInput" style={{ display: 'none' }} onChange={handleFileChange} />
          </div>
        </div>

        {status === 'verifying' && (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}>
            <Loader2 className="spinner" size={32} color="var(--accent-primary)" />
          </div>
        )}

        {status === 'authentic' && result && (
          <div className="result-card" style={{ borderLeft: '4px solid #10b981', backgroundColor: 'rgba(16, 185, 129, 0.05)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', color: '#10b981' }}>
              <CheckCircle size={24} />
              <h3 style={{ margin: 0 }}>Authentic Certificate</h3>
            </div>
            <div className="result-item">
              <span className="result-label">Issued To (UID)</span>
              <span className="result-value">{result.uid}</span>
            </div>
            <div className="result-item">
              <span className="result-label">Issuer Address</span>
              <span className="result-value" style={{ wordBreak: 'break-all' }}>{result.issuer}</span>
            </div>
            <div className="result-item">
              <span className="result-label">Date Issued</span>
              <span className="result-value">{result.timestamp}</span>
            </div>
            <div className="result-item">
              <span className="result-label">IPFS Reference</span>
              <span className="result-value" style={{ wordBreak: 'break-all' }}>{result.ipfsCID}</span>
            </div>
          </div>
        )}

        {status === 'revoked' && (
          <div className="result-card" style={{ borderLeft: '4px solid #f59e0b', backgroundColor: 'rgba(245, 158, 11, 0.05)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', color: '#f59e0b' }}>
              <AlertCircle size={24} />
              <h3 style={{ margin: 0 }}>Certificate Revoked</h3>
            </div>
            <p>This certificate exists but has been officially revoked by the issuer.</p>
          </div>
        )}

        {status === 'tampered' && (
          <div className="result-card" style={{ borderLeft: '4px solid #ef4444', backgroundColor: 'rgba(239, 68, 68, 0.05)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', color: '#ef4444' }}>
              <AlertCircle size={24} />
              <h3 style={{ margin: 0 }}>Not Authentic / Tampered</h3>
            </div>
            <p>We could not find a matching hash on the blockchain. The document may be forged or tampered with.</p>
          </div>
        )}
      </div>

      <div className="glass-card" style={{ padding: '2rem' }}>
        <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <FileText /> Why Blockchain?
        </h3>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
              <th style={{ padding: '1rem', color: 'var(--text-muted)' }}>Feature</th>
              <th style={{ padding: '1rem', color: '#ef4444' }}>Traditional System</th>
              <th style={{ padding: '1rem', color: '#10b981' }}>Our Blockchain System</th>
            </tr>
          </thead>
          <tbody>
            <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
              <td style={{ padding: '1rem' }}>Storage</td>
              <td style={{ padding: '1rem' }}>Centralized Database</td>
              <td style={{ padding: '1rem' }}>Decentralized (IPFS + Ethereum)</td>
            </tr>
            <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
              <td style={{ padding: '1rem' }}>Verification</td>
              <td style={{ padding: '1rem' }}>Manual / Email checks</td>
              <td style={{ padding: '1rem' }}>Instant Cryptographic Proof</td>
            </tr>
            <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
              <td style={{ padding: '1rem' }}>Tamper-Proofing</td>
              <td style={{ padding: '1rem' }}>Vulnerable to DB hacks</td>
              <td style={{ padding: '1rem' }}>Immutable Ledger (SHA-256)</td>
            </tr>
            <tr>
              <td style={{ padding: '1rem' }}>Cost & Speed</td>
              <td style={{ padding: '1rem' }}>High & Slow</td>
              <td style={{ padding: '1rem' }}>Near-zero & Real-time</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
