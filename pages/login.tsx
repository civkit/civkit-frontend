import { useEffect, useState } from "react";
import axios from "axios";
import { useRouter } from "next/router";
import Link from "next/link";
import { nip19 } from "nostr-tools";
import { GiOstrich } from "react-icons/gi";
import { generatePassword } from "../utils/generatePassword";

const LoginForm = () => {
  const [username, setUsername] = useState("");
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

    const password = await generatePassword(username);
    try {
      const response = await axios.post("http://localhost:3000/api/login", {
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
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md">
        <h2 className="text-2xl font-bold mb-6 text-center text-blue-600">
          Login to CivKit
        </h2>
        <div className="flex items-center justify-between">
          <button
            className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline flex items-center justify-center space-x-2 gap-2"
            onClick={handleLogin}
          >
            <GiOstrich />
            Login
          </button>
          <Link href="/register" legacyBehavior>
            <a className="inline-block align-baseline font-bold text-sm text-blue-500 hover:text-blue-800">
              Register
            </a>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default LoginForm;
