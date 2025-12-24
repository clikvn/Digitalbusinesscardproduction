
  # Digital Business Card Prod

  This is a code bundle for Digital Business Card Prod. The original project is available at https://www.figma.com/design/z3ZdLdShqzd1Kj7gtSlrOk/Digital-Business-Card-Prod.

  ## Running the code

  Run `npm i` to install the dependencies.

  Run `npm run dev` to start the development server.

  ## Chat Widget

  The app includes an embedded chat widget that is automatically loaded on app startup. The widget is configured to use:
  - Server: `https://agent-chat-widget-568865197474.europe-west1.run.app`
  - Tenant ID: `business-card-only`

  The widget exposes `window.__openAIAssistant()` function that can be called programmatically to open the chat interface. All AI Agent buttons throughout the app automatically trigger this function.
  