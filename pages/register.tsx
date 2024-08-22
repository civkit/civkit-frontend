import { useState, useEffect } from "react";
import axios from "axios";
import { useRouter } from "next/router";
import Link from "next/link";
import { GiOstrich } from "react-icons/gi";

const RegisterForm = () => {
  const [username, setUsername] = useState("");
  const [invoice, setInvoice] = useState("");
  const router = useRouter();

  useEffect(() => {
    const populateUsername = async () => {
      if (window.nostr) {
        try {
          const publicKey = await window.nostr.getPublicKey();
          setUsername(publicKey);
        } catch (error) {
          console.error("Error fetching public key:", error);
        }
      }
    };

    populateUsername();
  }, []);

  const handleRegister = async (event) => {
    event.preventDefault();
    try {
      const response = await axios.post(
        "http://localhost:3000/api/register",
        { username },
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
      alert("Registration failed. Please try again.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md">
        <h2 className="text-2xl font-bold mb-6 text-center text-blue-600">
          Register for CivKit
        </h2>
        <form onSubmit={handleRegister}>
          <div className="flex items-center justify-center h-full">
            <button
              className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline flex items-center justify-center space-x-2"
              type="submit"
            >
              <GiOstrich />
              <span>Register with Nostr</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RegisterForm;
