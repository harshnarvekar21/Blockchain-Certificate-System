# Blockchain Certificate System

A decentralized application (dApp) built with React, Vite, Hardhat, and Solidity to issue and verify certificates on the blockchain.

## Prerequisites
Before you begin, ensure you have the following installed on your machine:
- [Node.js](https://nodejs.org/) (v16 or higher recommended)
- [Git](https://git-scm.com/)
- [MetaMask](https://metamask.io/) browser extension

## Setup Instructions

Follow these steps to run the project on a new desktop:

### 1. Clone the repository
```bash
git clone https://github.com/harshnarvekar21/Blockchain-Certificate-System.git
cd Blockchain-Certificate-System
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Start the Local Blockchain Node
Open a terminal and run the following command to start a local Hardhat node. This will give you 20 test accounts with fake ETH.
```bash
npx hardhat node
```
*(Leave this terminal running in the background)*

### 4. Deploy the Smart Contract
Open a **new terminal window** in the same project directory and deploy the contract to your local network:
```bash
npx hardhat run scripts/deploy.cjs --network localhost
```

### 5. Start the Frontend Application
In the same terminal where you deployed the contract, start the Vite development server:
```bash
npm run dev
```

## Connecting MetaMask
To interact with the application, you need to connect your MetaMask wallet to the local Hardhat network:
1. Open MetaMask and go to **Settings > Networks > Add Network > Add a network manually**.
2. Fill in the details:
   - **Network Name**: Hardhat Local
   - **New RPC URL**: `http://127.0.0.1:8545/`
   - **Chain ID**: `31337`
   - **Currency Symbol**: `ETH`
3. Click **Save**.
4. To interact with the contracts, import one of the test accounts provided in step 3. In MetaMask, click on your account dropdown, select **Import Account**, and paste one of the private keys from the terminal running `npx hardhat node`.
