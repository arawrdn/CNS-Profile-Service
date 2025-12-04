import React, { useState, useEffect } from 'react';
import { 
  openConnect, 
  userSession 
} from '@stacks/connect';
import { 
  callReadOnlyFunction, 
  makeContractCall, 
  stringAsciiCV, 
  stringUtf8CV, 
  standardPrincipalCV,
  ClarityType 
} from '@stacks/transactions';
import { StacksMainnet } from 'micro-stacks/network'; // Recommended for Stacks transactions

// --- KONFIGURASI KONTRAK ---
// Ganti dengan alamat deployer Anda yang sebenarnya saat deployment
const contractAddress = "ST1PQHQKV0RJQDZKYR4T6YVRQND4K41GC7S1B1KBT"; 
const contractName = "cns-profile";
const network = new StacksMainnet(); 

// --- STATE AWAL ---
const initialProfile = {
  name: '',
  avatarUrl: '',
  bio: ''
};

function App() {
  const [userData, setUserData] = useState(null);
  const [profileData, setProfileData] = useState(initialProfile);
  const [status, setStatus] = useState('');

  // 1. AUTENTIKASI
  const authenticate = () => {
    openConnect({
      appDetails: {
        name: 'CNS Profile Service',
        icon: window.location.origin + '/logo.svg',
      },
      onFinish: (data) => {
        setUserData(data.authResponse);
      },
      userSession, // Use the shared user session
    });
  };

  useEffect(() => {
    if (userSession.isUserSignedIn()) {
      const user = userSession.loadUserData();
      setUserData(user);
    }
  }, []);

  // 2. FUNGSI READ-ONLY: Melihat Profil
  const viewProfile = async () => {
    if (!profileData.name) {
      setStatus('Please enter a CNS name to view.');
      return;
    }

    try {
      // Mengambil alamat pengirim dari dompet yang terhubung untuk read-only
      const senderAddress = userData ? userData.profile.stxAddress.mainnet : contractAddress;

      const result = await callReadOnlyFunction({
        contractAddress,
        contractName,
        functionName: 'get-profile',
        functionArgs: [stringAsciiCV(profileData.name)],
        senderAddress,
        network,
      });

      if (result.type === ClarityType.ResponseOk) {
        if (result.value.type === ClarityType.OptionalSome) {
          const data = result.value.value.value;
          setStatus(`Profile found for ${profileData.name}!`);
          console.log(data);
          // Menampilkan data yang ditemukan
        } else {
          setStatus(`No profile data found for ${profileData.name}.`);
        }
      } else {
        setStatus(`Error resolving name: ${result.value.value}`);
      }
    } catch (error) {
      console.error('View profile error:', error);
      setStatus('Failed to fetch profile.');
    }
  };


  // 3. FUNGSI TRANSACTION: Mengatur Profil (Membutuhkan Tanda Tangan)
  const setProfile = async () => {
    if (!userData || !profileData.name) {
      setStatus('Please connect your wallet and enter a CNS name.');
      return;
    }

    setStatus('Sending transaction to set profile...');

    try {
      await makeContractCall({
        contractAddress,
        contractName,
        functionName: 'set-profile',
        functionArgs: [
          stringAsciiCV(profileData.name),
          stringUtf8CV(profileData.avatarUrl),
          stringUtf8CV(profileData.bio)
        ],
        network,
        postConditionMode: 1, // Allow sender to define post conditions
        onFinish: (data) => {
          setStatus(`Profile transaction sent! TX ID: ${data.txId}`);
          console.log('Transaction finished:', data);
        },
        onCancel: () => {
          setStatus('Transaction cancelled.');
        },
      });
    } catch (error) {
      console.error('Set profile error:', error);
      setStatus('Failed to send transaction.');
    }
  };


  // 4. RENDERING UI
  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
      <h1>CNS Profile Manager</h1>
      <p>A Stacks Composable Project for Code for STX</p>
      
      {!userData ? (
        <button onClick={authenticate}>Connect Stacks Wallet</button>
      ) : (
        <p>Wallet Connected: **{userData.profile.stxAddress.mainnet}**</p>
      )}

      <hr />

      <h2>Set Profile</h2>
      <div style={{ display: 'flex', flexDirection: 'column', maxWidth: '400px', gap: '10px' }}>
        <input 
          placeholder="CNS Name (e.g., andi.stx)" 
          value={profileData.name} 
          onChange={(e) => setProfileData({...profileData, name: e.target.value})}
        />
        <input 
          placeholder="Avatar URL (String-UTF8)" 
          value={profileData.avatarUrl} 
          onChange={(e) => setProfileData({...profileData, avatarUrl: e.target.value})}
        />
        <textarea 
          placeholder="Bio / Short Description (String-UTF8)" 
          value={profileData.bio} 
          onChange={(e) => setProfileData({...profileData, bio: e.target.value})}
        />
        <button onClick={setProfile} disabled={!userData}>
          Set Profile (Requires TX Fee)
        </button>
      </div>

      <hr />

      <h2>View Profile (Read Only)</h2>
       <div style={{ display: 'flex', gap: '10px', maxWidth: '400px' }}>
         <input 
          placeholder="Enter CNS Name to view" 
          value={profileData.name} 
          onChange={(e) => setProfileData({...profileData, name: e.target.value})}
        />
        <button onClick={viewProfile}>
          View Profile
        </button>
      </div>

      <p style={{ marginTop: '20px', fontWeight: 'bold' }}>Status: {status}</p>

      {/* Tambahkan logika untuk menampilkan data profil yang diambil di sini */}

    </div>
  );
}

export default App;
