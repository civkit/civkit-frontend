import { useEffect, useState } from "react";
import axios from "axios";
import { useRouter } from "next/router";
import Link from "next/link";
import { nip19 } from "nostr-tools";
import { GiOstrich } from "react-icons/gi";
import { generatePassword } from "../utils/generatePassword";

const LoginForm = ({ darkMode, toggleDarkMode }: { darkMode: boolean, toggleDarkMode: () => void }) => {
  const [username, setUsername] = useState("");
  const [extensionError, setExtensionError] = useState("");
  const router = useRouter();

  useEffect(() => {
    const fetchUserName = async () => {
      if (window.nostr) {
        try {
          const publicKey = await window.nostr.getPublicKey();
          const npub = nip19.npubEncode(publicKey);
          setUsername(npub);
          console.log("Username: ", username);
        } catch (error) {
          console.error("Error fetching public key:", error);
        }
      }
    };

    fetchUserName();
  }, []);

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!window.nostr) {
      setExtensionError("Nostr extension is not installed.");
      return;
    }

    const password = await generatePassword(username);
    try {
      const response = await axios.post(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/login`, {
        username,
        password,
      });
      console.log(response);
      localStorage.setItem("token", response.data.token);
      alert("Login successful!");
      router.push("/orders"); // Redirect to orders page
    } catch (error) {
      console.error("Error logging in:", error);
      alert("Login failed. Please try again.");
    }
  };

  return (
    <div className={`min-h-screen flex items-center justify-center ${darkMode ? 'bg-gray-900' : 'bg-gray-100'}`}>
      <div className={`p-8 rounded-lg shadow-lg w-full max-w-md ${darkMode ? 'bg-gray-800 text-white' : 'bg-white text-black'}`}>
        <h2 className={`text-2xl font-bold mb-6 text-center ${darkMode ? 'text-orange-400' : 'text-orange-600'}`}>
          Login to CivKit
        </h2>
        <form onSubmit={handleLogin}>
          {extensionError && (
            <div className="text-red-500 mb-4">{extensionError}</div>
          )}
          <div className="flex flex-col items-center">
            <button
              className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline flex items-center justify-center space-x-2"
              type="submit"
            >
              <GiOstrich />
              <span>Login</span>
            </button>
            <Link href="/register" legacyBehavior>
              <a className={`mt-4 inline-block align-baseline font-bold text-sm ${darkMode ? 'text-white hover:text-white' : 'text-gray-400 hover:text-gray-500'}`}>
                Yet to register?
              </a>
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LoginForm;
