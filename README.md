## Start Here!

Civkit is Open Source. Forever. The goal is simple. Create the building blocks of unstoppable peer-to-peer marketplaces. 

All releases are on Github. As a user, you only need to install the Nos2x plugin. We will add other options for now but this is currently the method. Install this on your browser and navigate to Register. You will purchase a staking credential and be able to login and take orders. Both orderbook and reputation are visible at frontend.civkit.africa/filteredOrders and frontend.civkit.africa/filteredRatings. 

Taking these orders requires a small committment of paying a hold invoice, which is relesed back if the trade is successful. The purpose of this is to prevent cheating and time wasters. Your sats will be returned and are only a small % of the trade amount. Your trades will be displayed on the internal orderbook but also sent as nostr event types to the relays accepting nostr trades. 

We use these event types 
- 1505: Announcing a civkit node is live (for marketplace runners to tell users they exist)
- 1506: An order has been placed with link to where to take it. This is relayed across nostr to other relays so even if 1 market goes down, another market can spin up and find a partner for the trade
- 1507: An order has been taken by a counterparty
- 1508: A trade has been completed and each user ranks the other. Reputations are tied to your nostr identity. The PGP chatroom is encrypted and anonymous.
  
If a dispute occurs, the chat is locked and exported to the moderator to resolve. This decentralizes chat back to core PGP principles and keeps you safe from prying eyes. If a trade is successful, the sats are released to the sats buyer when fiat or product is received. You are ranked and this is sent to nostr.

Have fun trading, stay safe and guard your reputation without trading over your privacy. Be a good human.

## Civkit Frontend

This is a sample client for a Civkit Node. It provides a UI to create P2P trade orders. 

The application is using:
- civkit-api: https://github.com/civkit/civkit-api 
- civkit-chat: https://github.com/civkit/civkit-chat

### The UI requires 
- next.js
- typescript
- nos2x plugin https://github.com/fiatjaf/nos2x


You can use this to create buy/sell orders for peer-to-peer trades, pay the hold invoices, chat with the trading partner, confirm fiat received to release payment, raise disputes (in chat app) and view other trade orders. You have the option to sign orders as a custom nostr event type 1506. This allows orders to be shared amongst nostr relays accepting these types to create a global orderbook. 

The escrow system will return bolt11 invoices. You lock 5% of the amount of the trade in a hold invoice which is released when the trade is completed. You will be provided with URL's to access the encrypted chat which has some basic dispute features. The code for that is listed above and seperate. You can register a user at the /register endpoint then login. From there you can create buy/sell orders and make trades.

This has been validated on testnet, regtest, signet and mainnet. We encourage further client development and this is intended as a reference guide for further development. Running the code is pretty simple as described below.

If you run into any issues with the code, feel free to raise an issue so we can improve its useability and make it more mainnet ready.

## Getting Started

```bash
npm install 
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

If you have set this up correctly, you will see the civkit home page. This will not load invoices or have much functionality until you install API code so if you get as far as the screenshot below, its time to setup the API https://github.com/civkit/civkit-api

If you see this, you've got the frontend going!!! 

![image](https://github.com/user-attachments/assets/d23c12b4-4897-47a6-a15f-0c7430fce20b)

The code assumes the following ports are assigned the following applications
- 3001: Frontend
- 3000: API
- 3456: Chat

You can look through the key components such as the pages folder and dashboard to see where the bulk of user face code is.

Proceed to Register

![register](https://github.com/user-attachments/assets/799ff046-00eb-4baa-a818-d3e198edd24f)

Pay The Registration Invoice. It will redirect automatically.

![registerPayment](https://github.com/user-attachments/assets/127f200b-208e-468f-a4c6-cc9a984dc749)

View and Take Pending Orders

![Screenshot from 2024-11-28 12-03-19](https://github.com/user-attachments/assets/e26869a4-ab78-4e3d-bd56-4d6c7dcb0e91)

View Your Own Orders

![myOrderV2](https://github.com/user-attachments/assets/ddfc5db4-f2f8-45ba-969d-ff3957e2b4f8)

View Ratings (Internal only)

![internalRatings](https://github.com/user-attachments/assets/dda5c5af-da4f-419c-8ce0-2a5a75e2b282)

Submit Payout Invoice

![submitPayout](https://github.com/user-attachments/assets/bf61a855-08f1-4b9e-8244-536dbc4ff596)

Open Chat 

![openChat](https://github.com/user-attachments/assets/8865f8b5-1fd8-4ba8-8b51-6ec748b1c4d3)

Redirect to Chatroom

![makeOfferredirect](https://github.com/user-attachments/assets/9dd4483c-2ad7-4c95-b5c8-2291ea4750c2)


Trade Complete - WIth Nostr Prompt

![ratingwithNostr](https://github.com/user-attachments/assets/980753ff-4dc0-4e40-8d88-cc2232cf6bc7)

## How to Contribute

This code is 100% open source and relies on the contributions of other open source developers. Feel free to look through the issues, open new issues and submit PR's to improve the experience. This project has been tested and validated on mainnet, but the ideas of the crowd will get us closer to a flawless UI/UX experience.

I have created a list of issues but please take these as a starting point. Frontend is not my strong suit and I know that a solidly skilled FE developer could really enhance this product. I encourage and welcome all contributions. Feel welcome to open issues. We also have a telegram community here: 


