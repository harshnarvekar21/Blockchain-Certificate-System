/**
 * Mock IPFS Service
 * Simulates uploading a file to IPFS and returning a deterministic CID.
 * In a production environment, this would interact with a Pinata/Infura API.
 */

// Simple base58 encoding mock based on SHA-256 hash
function mockBase58(hexString) {
  const chars = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
  let hash = 0;
  for (let i = 0; i < hexString.length; i++) {
    hash = (hash * 31 + hexString.charCodeAt(i)) % chars.length;
  }
  return 'Qm' + chars.slice(hash % chars.length) + chars.slice((hash * 7) % chars.length) + 'MockIPFSHash' + hexString.substring(0, 10);
}

export const uploadToIPFS = async (file, documentHash) => {
  return new Promise((resolve) => {
    // Simulate network delay
    setTimeout(() => {
      // Generate a mock CID based on the file hash so it's deterministic
      const cid = mockBase58(documentHash.replace('0x', ''));
      
      // We would normally return just the CID, but for demo purposes, 
      // we'll return a mock ipfs URI.
      resolve(`ipfs://${cid}`);
    }, 1500);
  });
};
