import { useState } from 'react';
import { UploadCloud, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { calculateFileHash } from '../utils/crypto';

export default function VerifyCertificate({ contract }) {
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState('idle'); // idle, checking, valid, invalid, error
  const [certData, setCertData] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setStatus('idle');
      setCertData(null);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
      setStatus('idle');
      setCertData(null);
    }
  };

  const handleDragOver = (e) => e.preventDefault();

  const handleVerify = async () => {
    if (!file || !contract) return;
    
    try {
      setStatus('checking');
      const hash = await calculateFileHash(file);
      
      const result = await contract.verifyCertificate(hash);
      const isValid = result[0];
      const timestamp = Number(result[1]);
      const issuer = result[2];

      if (isValid) {
        setCertData({
          date: new Date(timestamp * 1000).toLocaleString(),
          issuer: issuer
        });
        setStatus('valid');
      } else {
        setStatus('invalid');
      }
    } catch (err) {
      console.error(err);
      setErrorMsg(err.reason || err.message || 'Failed to verify certificate');
      setStatus('error');
    }
  };

  return (
    <div className="glass-card">
      <div 
        className="file-drop-zone"
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onClick={() => document.getElementById('verifyFileInput').click()}
      >
        <UploadCloud className="file-drop-icon" />
        {file ? (
          <p className="text-main" style={{ color: 'var(--text-main)', fontWeight: '600' }}>
            {file.name} ({(file.size / 1024).toFixed(2)} KB)
          </p>
        ) : (
          <p>Click or drag and drop a document to verify its authenticity</p>
        )}
        <input 
          type="file" 
          id="verifyFileInput" 
          style={{ display: 'none' }} 
          onChange={handleFileChange}
        />
      </div>

      {status === 'error' && (
        <div style={{ marginBottom: '1.5rem', color: '#ef4444' }}>
          {errorMsg}
        </div>
      )}

      {status === 'valid' && certData && (
        <div className="result-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
            <div className="status-badge status-valid">
              <CheckCircle size={16} /> Authentic Document
            </div>
          </div>
          
          <div className="result-item">
            <span className="result-label">Issued On</span>
            <span className="result-value">{certData.date}</span>
          </div>
          <div className="result-item">
            <span className="result-label">Issuer Address</span>
            <span className="result-value">{certData.issuer.substring(0, 8)}...{certData.issuer.substring(certData.issuer.length - 6)}</span>
          </div>
        </div>
      )}

      {status === 'invalid' && (
        <div className="result-card" style={{ borderColor: 'rgba(239, 68, 68, 0.3)', background: 'rgba(239, 68, 68, 0.05)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div className="status-badge status-invalid">
              <XCircle size={16} /> Unverified Document
            </div>
          </div>
          <p style={{ marginTop: '1rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            This document's hash does not exist on the blockchain. It may have been altered or was never issued by the authority.
          </p>
        </div>
      )}

      <button 
        className="btn btn-primary" 
        style={{ width: '100%', marginTop: '1rem' }}
        onClick={handleVerify}
        disabled={!file || !contract || status === 'checking'}
      >
        {status === 'checking' ? <><Loader2 className="spinner" size={20}/> Verifying on Blockchain...</> : 'Verify Authenticity'}
      </button>
    </div>
  );
}
