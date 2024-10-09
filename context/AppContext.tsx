'use client';
import { NDKPrivateKeySigner } from '@nostr-dev-kit/ndk';
import { useNDK } from '@nostr-dev-kit/ndk-react';
import { nip19 } from 'nostr-tools';
import React, {
  createContext,
  useEffect,
  useState,
  ReactNode,
  useContext,
  use,
} from 'react';
import { generateSecretKey } from 'nostr-tools';

interface AppContextType {
  secretKey: Uint8Array | null;
  pubkey: string | null;
}

export const AppContext = createContext<AppContextType>({
  secretKey: null,
  pubkey: null,
});

interface AppProviderProps {
  children: ReactNode;
}

const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  const [pubkey, setPubkey] = useState<string | null>(null);
  const [secretKey, setSecretKey] = useState<Uint8Array | null>(null);
  const { loginWithSecret, signer, ndk } = useNDK();

  useEffect(() => {
    if (!signer) {
      return;
    }
    const helper = async () => {
      const user = await signer.user();
      const privateKeySigner = signer as NDKPrivateKeySigner;
      let { type, data } = nip19.decode(user.npub);
      setPubkey(data as string);
      console.log(Buffer.from(privateKeySigner.privateKey!, 'hex'));
      setSecretKey(Buffer.from(privateKeySigner.privateKey!, 'hex'));
    };
    helper();
  }, [signer]);

  useEffect(() => {
    const login = async () => {
      // const user = await loginWithSecret(Buffer.from(generateSecretKey()).toString('hex'));
      const secretKey = localStorage.getItem('secretKey');
      if (!secretKey) {
        const tmp = generateSecretKey();
        const newSecretKey = Buffer.from(tmp).toString('hex');
        localStorage.setItem('secretKey', newSecretKey);
        const user = await loginWithSecret(newSecretKey);
      } else {
        const user = await loginWithSecret(secretKey);
      }
    };
    login();
  }, []);

  return (
    <AppContext.Provider value={{ pubkey: pubkey, secretKey: secretKey }}>
      {children}
    </AppContext.Provider>
  );
};
export const useAppContext = () => useContext(AppContext);

export default AppProvider;
