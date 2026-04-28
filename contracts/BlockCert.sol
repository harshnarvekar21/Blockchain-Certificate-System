// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract BlockCert {
    address public admin;

    struct Certificate {
        bool exists;
        bool isValid; // For revocation
        uint256 timestamp;
        address issuer;
        string uid;
        string ipfsCID;
    }

    // Mapping from document hash to Certificate details
    mapping(string => Certificate) private certificates;
    
    // Mapping from uid to document hash to make lookups easier for Candidate Dashboard
    mapping(string => string[]) private uidToHashes;

    event CertificateIssued(string indexed documentHash, string indexed uid, uint256 timestamp, address indexed issuer, string ipfsCID);
    event CertificateRevoked(string indexed documentHash, uint256 timestamp);

    modifier onlyAdmin() {
        require(msg.sender == admin, "Only admin can perform this action");
        _;
    }

    constructor() {
        admin = msg.sender;
    }

    /**
     * @dev Issues a new certificate by storing its hash, UID, and IPFS CID.
     */
    function issueCertificate(string memory _documentHash, string memory _uid, string memory _ipfsCID) public onlyAdmin {
        require(!certificates[_documentHash].exists, "Certificate already exists");

        certificates[_documentHash] = Certificate({
            exists: true,
            isValid: true,
            timestamp: block.timestamp,
            issuer: msg.sender,
            uid: _uid,
            ipfsCID: _ipfsCID
        });

        uidToHashes[_uid].push(_documentHash);

        emit CertificateIssued(_documentHash, _uid, block.timestamp, msg.sender, _ipfsCID);
    }

    /**
     * @dev Revokes a certificate by its hash.
     */
    function revokeCertificate(string memory _documentHash) public onlyAdmin {
        require(certificates[_documentHash].exists, "Certificate does not exist");
        require(certificates[_documentHash].isValid, "Certificate already revoked");

        certificates[_documentHash].isValid = false;

        emit CertificateRevoked(_documentHash, block.timestamp);
    }

    /**
     * @dev Verifies a certificate by checking its hash.
     */
    function verifyCertificate(string memory _documentHash) public view returns (bool exists, bool isValid, uint256 timestamp, address issuer, string memory uid, string memory ipfsCID) {
        Certificate memory cert = certificates[_documentHash];
        return (cert.exists, cert.isValid, cert.timestamp, cert.issuer, cert.uid, cert.ipfsCID);
    }

    /**
     * @dev Get all certificate hashes for a given UID.
     */
    function getHashesByUID(string memory _uid) public view returns (string[] memory) {
        return uidToHashes[_uid];
    }
}
