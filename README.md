
## Getting Started

This is a sample client for a Civkit Node. It provides a UI to create P2P trade orders. The application is using the civkit-api backend code which is here: https://github.com/MarketMadi/civkit-api as well as civkit-chat which is here https://github.com/MarketMadi/civkit-chat.

The UI requires

next.js
API/Chat app running
nos2x plugin https://github.com/fiatjaf/nos2x
You can use this to create buy/sell orders for peer-to-peer trades, pay the hold invoices, chat with the trading partner, confirm fiat received to release payment, raise disputes (in chat app) and view other trade orders. You have the option to sign orders as a custom nostr event type 1506. This allows orders to be shared amongst nostr relays accepting these types to create a global orderbook.

The escrow system will return bolt11 invoices. You lock 5% of the amount of the trade in a hold invoice which is released when the trade is completed. You will be provided with URL's to access the encrypted chat which has some basic dispute features. The code for that is listed above and seperate.

You can register a user at the /register endpoint then login. From there you can create buy/sell orders and make trades.

This is all on testnet and should not be used for real trades. We encourage further client development and this is intended as a reference guide for further development.

Running the code is pretty simple as described below. It assumes the API is on localhost:3000 and chat on localhost:3456. Its a good idea to get the api running first.

If you run into any issues with the code, feel free to raise an issue so we can improve its useability and make it more mainnet ready.


```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/basic-features/font-optimization) to automatically optimize and load Inter, a custom Google Font.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js/) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/deployment) for more details.
