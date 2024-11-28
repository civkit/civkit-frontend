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

If you see this, you've got the frontend going.

![image](https://github.com/user-attachments/assets/d23c12b4-4897-47a6-a15f-0c7430fce20b)

The code assumes the following ports are assigned the following applications
- 3001: Frontend
- 3000: API
- 3456: Chat

You can look through the key components such as the pages folder and dashboard to see where the bulk of user face code is.

## How to Contribute

This code is 100% open source and relies on the contributions of other open source developers. Feel free to look through the issues, open new issues and submit PR's to improve the experience. This project has been tested and validated on mainnet, but the ideas of the crowd will get us closer to a flawless UI/UX experience.

I have created a list of issues but please take these as a starting point. Frontend is not my strong suit and I know that a solidly skilled FE developer could really enhance this product. I encourage and welcome all contributions. Feel welcome to open issues. We also have a telegram community here: 


