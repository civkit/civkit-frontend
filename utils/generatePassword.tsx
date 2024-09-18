const secretKey = process.env.NEXT_PUBLIC_SECRET_KEY;

export const generatePassword = async (username: string) => {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secretKey);
  const messageData = encoder.encode(username);

  // Import the key
  const key = await crypto.subtle.importKey(
    "raw",
    keyData,
    { name: "HMAC", hash: { name: "SHA-256" } },
    false,
    ["sign"]
  );

  // Sign the username using the key to generate the HMAC
  const signature = await crypto.subtle.sign("HMAC", key, messageData);

  // Convert the signature to a hex string
  const hashArray = Array.from(new Uint8Array(signature));
  const hashHex = hashArray
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  console.log("Generated password: ", hashHex.substring(0, 10));

  // Optionally truncate the hash to a desired length (e.g., 10 characters)
  return hashHex.substring(0, 10);
};

