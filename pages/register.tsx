import React, { useState, useEffect } from "react";
import axios from "axios";
import { useRouter } from "next/router";
import Link from "next/link";
import { GiOstrich } from "react-icons/gi";
import { headers } from "next/headers";
import { nip19 } from "nostr-tools";
import { generatePassword } from "../utils/generatePassword";

const RegisterForm = ({ darkMode, toggleDarkMode }: { darkMode: boolean, toggleDarkMode: () => void }) => {
  const [username, setUsername] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [invoice, setInvoice] = useState("");
  const [hasNostrExtension, setHasNostrExtension] = useState<Boolean>();
  const [extensionError, setExtensionError] = useState("");

  const router = useRouter();

  useEffect(() => {
    const fetchUsername = async () => {
      if (window.nostr) {
        try {
          const publicKey = await window.nostr.getPublicKey();
          const npub = nip19.npubEncode(publicKey);
          console.log(publicKey);
          console.log(npub);
          setUsername(npub);
          setHasNostrExtension(!!window.nostr);
        } catch (error) {
          console.error("Error fetching public key:", error);
        }
      }
    };

    fetchUsername();
  }, []);

  useEffect(() => {
    const handleGeneratePassword = async () => {
      if (username) {
        const userPassword = await generatePassword(username);
        setPassword(userPassword);
        console.log("Password: ", userPassword);
      }
    };

    handleGeneratePassword();
  }, [username]);

  const handleRegister = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!hasNostrExtension) {
      setExtensionError("Nostr extension is not installed.");
      return;
    }

    try {
      console.log("Hello world");
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/register`,
        { username, password },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      setInvoice(response.data.invoice);
      router.push(`/registerPayment?username=${username}`); // Redirect to payment page
    } catch (error) {
      console.error("Error registering:", error);
      setExtensionError("Registration failed. Please try again.");
    }
  };

  return (
    <div className={`min-h-screen flex items-center justify-center ${darkMode ? 'bg-gray-900' : 'bg-gray-100'}`}>
      <div className={`p-8 rounded-lg shadow-lg w-full max-w-md ${darkMode ? 'bg-gray-800 text-white' : 'bg-white text-black'}`}>
        <h2 className={`text-2xl font-bold mb-6 text-center ${darkMode ? 'text-orange-400' : 'text-orange-600'}`}>
          Register for CivKit
        </h2>
        <form onSubmit={handleRegister}>
          {hasNostrExtension === false && (
            <div className="text-red-500 mb-4">
              Nostr extension not found. Please install a Nostr-compatible extension.
            </div>
          )}
          {extensionError && (
            <div className="text-red-500 mb-4">{extensionError}</div>
          )}
          <div className="flex flex-col items-center">
            <button
              className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline flex items-center justify-center space-x-2"
              type="submit"
              disabled={!hasNostrExtension}
            >
              <GiOstrich />
              <span>Register</span>
            </button>
            <Link href="/login" legacyBehavior>
              <a className={`mt-4 inline-block align-baseline font-bold text-sm ${darkMode ? 'text-white hover:text-white' : 'text-gray-400 hover:text-gray-500'}`}>
                Proceed to login?
              </a>
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RegisterForm;
