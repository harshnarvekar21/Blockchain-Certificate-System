import { useState } from 'react';
import { UploadCloud, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { calculateFileHash } from '../utils/crypto';

export default function IssueCertificate({ contract }) {
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState('idle'); // idle, hashing, confirming, success, error
  const [txHash, setTxHash] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setStatus('idle');
      setErrorMsg('');
      setTxHash('');
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
      setStatus('idle');
      setErrorMsg('');
      setTxHash('');
    }
  };

  const handleDragOver = (e) => e.preventDefault();

  const handleIssue = async () => {
    if (!file || !contract) return;
    
    try {
      setStatus('hashing');
      const hash = await calculateFileHash(file);
      
      setStatus('confirming');
      const tx = await contract.issueCertificate(hash);
      
      setStatus('mining');
      await tx.wait();
      
      setTxHash(tx.hash);
      setStatus('success');
    } catch (err) {
      console.error(err);
      setErrorMsg(err.reason || err.message || 'Failed to issue certificate');
      setStatus('error');
    }
  };

  return (
    <div className="glass-card">
      <div 
        className="file-drop-zone"
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onClick={() => document.getElementById('issueFileInput').click()}
      >
        <UploadCloud className="file-drop-icon" />
        {file ? (
          <p className="text-main" style={{ color: 'var(--text-main)', fontWeight: '600' }}>
            {file.name} ({(file.size / 1024).toFixed(2)} KB)
          </p>
        ) : (
          <p>Click or drag and drop to select a document to issue</p>
        )}
        <input 
          type="file" 
          id="issueFileInput" 
          style={{ display: 'none' }} 
          onChange={handleFileChange}
        />
      </div>

      {status === 'error' && (
        <div style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#ef4444' }}>
          <AlertCircle size={20} />
          <span>{errorMsg}</span>
        </div>
      )}

      {status === 'success' && (
        <div className="result-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', color: 'var(--accent-tertiary)' }}>
            <CheckCircle size={24} />
            <h3 style={{ margin: 0 }}>Certificate Issued Successfully!</h3>
          </div>
          <div className="result-item">
            <span className="result-label">Transaction Hash</span>
            <span className="result-value">{txHash.substring(0, 10)}...{txHash.substring(txHash.length - 8)}</span>
          </div>
          <div className="result-item">
            <span className="result-label">Document</span>
            <span className="result-value">{file?.name}</span>
          </div>
        </div>
      )}

      <button 
        className="btn btn-primary" 
        style={{ width: '100%', marginTop: '1rem' }}
        onClick={handleIssue}
        disabled={!file || !contract || ['hashing', 'confirming', 'mining'].includes(status)}
      >
        {status === 'hashing' && <><Loader2 className="spinner" size={20}/> Hashing Document...</>}
        {status === 'confirming' && <><Loader2 className="spinner" size={20}/> Waiting for Signature...</>}
        {status === 'mining' && <><Loader2 className="spinner" size={20}/> Mining Transaction...</>}
        {['idle', 'error', 'success'].includes(status) && 'Issue Certificate'}
      </button>
    </div>
  );
}
