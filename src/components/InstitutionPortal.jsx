import { useState } from 'react';
import { UploadCloud, CheckCircle, AlertCircle, Loader2, XCircle } from 'lucide-react';
import { calculateFileHash, calculateDataHash } from '../utils/crypto';
import { uploadToIPFS } from '../utils/ipfsMock';

export default function InstitutionPortal({ contract }) {
  const [activeSubTab, setActiveSubTab] = useState('issue'); // issue, revoke
  const [file, setFile] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    uid: '',
    course: '',
    date: ''
  });
  
  const [status, setStatus] = useState('idle'); // idle, processing, success, error
  const [txHash, setTxHash] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [ipfsLink, setIpfsLink] = useState('');
  const [revokeHash, setRevokeHash] = useState('');

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setStatus('idle');
    }
  };

  const handleIssue = async (e) => {
    e.preventDefault();
    if (!contract) return;
    
    // We need either a file OR form data
    if (!file && (!formData.name || !formData.uid)) {
      setErrorMsg('Please upload a PDF or fill in the certificate details.');
      setStatus('error');
      return;
    }
    
    try {
      setStatus('processing');
      setErrorMsg('');
      
      let documentHash;
      if (file) {
        documentHash = await calculateFileHash(file);
      } else {
        const dataString = JSON.stringify(formData);
        documentHash = await calculateDataHash(dataString);
      }
      
      // Upload to IPFS (Mock)
      const cid = await uploadToIPFS(file || formData, documentHash);
      setIpfsLink(cid);
      
      // Store on Blockchain
      const tx = await contract.issueCertificate(
        documentHash, 
        formData.uid || "NO_UID", 
        cid
      );
      
      await tx.wait();
      
      setTxHash(tx.hash);
      setStatus('success');
    } catch (err) {
      console.error(err);
      setErrorMsg(err.reason || err.message || 'Failed to issue certificate');
      setStatus('error');
    }
  };

  const handleRevoke = async (e) => {
    e.preventDefault();
    if (!revokeHash || !contract) return;

    try {
      setStatus('processing');
      setErrorMsg('');

      const tx = await contract.revokeCertificate(revokeHash);
      await tx.wait();

      setTxHash(tx.hash);
      setStatus('success');
    } catch (err) {
      console.error(err);
      setErrorMsg(err.reason || err.message || 'Failed to revoke certificate');
      setStatus('error');
    }
  };

  return (
    <div className="glass-card" style={{ padding: '2rem' }}>
      <h2 style={{ marginBottom: '1.5rem' }}>Institution Portal</h2>
      
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
        <button 
          className={`btn ${activeSubTab === 'issue' ? 'btn-primary' : 'btn-glass'}`}
          onClick={() => { setActiveSubTab('issue'); setStatus('idle'); }}
        >
          Issue Certificate
        </button>
        <button 
          className={`btn ${activeSubTab === 'revoke' ? 'btn-primary' : 'btn-glass'}`}
          onClick={() => { setActiveSubTab('revoke'); setStatus('idle'); }}
        >
          Revoke Certificate
        </button>
      </div>

      {activeSubTab === 'issue' && (
        <form onSubmit={handleIssue}>
          <div style={{ display: 'grid', gap: '1rem', marginBottom: '1.5rem' }}>
            <input className="input-field" name="name" placeholder="Candidate Name" value={formData.name} onChange={handleInputChange} />
            <input className="input-field" name="uid" placeholder="Candidate UID (e.g., Student ID)" value={formData.uid} onChange={handleInputChange} />
            <input className="input-field" name="course" placeholder="Course / Degree" value={formData.course} onChange={handleInputChange} />
            <input className="input-field" name="date" type="date" value={formData.date} onChange={handleInputChange} />
          </div>

          <div style={{ textAlign: 'center', marginBottom: '1rem', color: 'var(--text-muted)' }}>OR UPLOAD EXISTING PDF</div>

          <div 
            className="file-drop-zone"
            onClick={() => document.getElementById('issueFileInput').click()}
            style={{ marginBottom: '1.5rem' }}
          >
            <UploadCloud className="file-drop-icon" />
            {file ? (
              <p style={{ color: 'var(--text-main)', fontWeight: '600' }}>
                {file.name} ({(file.size / 1024).toFixed(2)} KB)
              </p>
            ) : (
              <p>Click to select a document to issue</p>
            )}
            <input type="file" id="issueFileInput" style={{ display: 'none' }} onChange={handleFileChange} />
          </div>

          {status === 'error' && (
            <div style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#ef4444' }}>
              <AlertCircle size={20} />
              <span>{errorMsg}</span>
            </div>
          )}

          {status === 'success' && (
            <div className="result-card" style={{ marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', color: 'var(--accent-tertiary)' }}>
                <CheckCircle size={24} />
                <h3 style={{ margin: 0 }}>Certificate Issued!</h3>
              </div>
              <div className="result-item">
                <span className="result-label">Tx Hash</span>
                <span className="result-value">{txHash.substring(0, 10)}...</span>
              </div>
              <div className="result-item">
                <span className="result-label">IPFS CID</span>
                <span className="result-value">{ipfsLink}</span>
              </div>
            </div>
          )}

          <button 
            className="btn btn-primary" 
            style={{ width: '100%' }}
            type="submit"
            disabled={status === 'processing'}
          >
            {status === 'processing' ? <><Loader2 className="spinner" size={20}/> Processing...</> : 'Issue Certificate'}
          </button>
        </form>
      )}

      {activeSubTab === 'revoke' && (
        <form onSubmit={handleRevoke}>
          <div style={{ marginBottom: '1.5rem' }}>
            <p style={{ marginBottom: '1rem', color: 'var(--text-muted)' }}>
              Revoking a certificate marks it as invalid on the blockchain permanently.
            </p>
            <input 
              className="input-field" 
              placeholder="Enter Document Hash to Revoke" 
              value={revokeHash} 
              onChange={(e) => setRevokeHash(e.target.value)} 
              required
            />
          </div>

          {status === 'error' && (
            <div style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#ef4444' }}>
              <AlertCircle size={20} />
              <span>{errorMsg}</span>
            </div>
          )}

          {status === 'success' && (
            <div className="result-card" style={{ marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', color: 'var(--accent-tertiary)' }}>
                <CheckCircle size={24} />
                <h3 style={{ margin: 0 }}>Certificate Revoked</h3>
              </div>
              <div className="result-item">
                <span className="result-label">Tx Hash</span>
                <span className="result-value">{txHash.substring(0, 10)}...</span>
              </div>
            </div>
          )}

          <button 
            className="btn" 
            style={{ width: '100%', backgroundColor: '#ef4444', color: 'white' }}
            type="submit"
            disabled={status === 'processing' || !revokeHash}
          >
            {status === 'processing' ? <><Loader2 className="spinner" size={20}/> Revoking...</> : <><XCircle size={20}/> Revoke Certificate</>}
          </button>
        </form>
      )}
    </div>
  );
}
