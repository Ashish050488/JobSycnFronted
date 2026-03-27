<div align="center">
  <h1>JobSync Frontend Client</h1>
  <p>The premium, high-performance web interface built for the JobSync platform.</p>
</div>

---

## 📖 Overview

The JobSync Frontend Client is a state-of-the-art Single Page Application (SPA) engineered to deliver a seamless, intuitive, and highly responsive user experience. It serves as the primary visual interface for candidates and companies utilizing the JobSync hub. 

Built with scalability and user experience in mind, the frontend architecture focuses on clean component separation, efficient state management, and strict type-safety. The design system heavily leverages utility-first CSS to create a modern, accessible, and highly engaging UI that interacts smoothly with our proprietary backend data engines.

## ✨ Core Features

*   **Dynamic Dashboard:** A rich, interactive interface that provides users with real-time insights, application tracking, and personalized job recommendations.
*   **Fluid Navigation & Routing:** Utilizes advanced client-side routing to ensure instant page transitions without full browser reloads, preserving application state.
*   **Secure Identity Management:** Seamlessly integrates with the backend's JWT-based authentication layer and supports SSO via Google OAuth for frictionless onboarding.
*   **Responsive Design System:** Fully optimized across desktop, tablet, and mobile breakpoints using a heavily customized Tailwind CSS configuration.
*   **AI Insights Display:** Renders complex AI-generated semantic matches and job categorizations intelligently, helping users understand *why* a job is a good fit.

## 🛠 Technology Stack

Our frontend relies on a modern, enterprise-grade technology stack:

*   **Core Library:** [React 19](https://react.dev/) 
*   **Language:** [TypeScript](https://www.typescriptlang.org/) (Strict Mode)
*   **Build Tooling:** [Vite](https://vitejs.dev/) (For ultra-fast Hot Module Replacement and optimized production builds)
*   **Routing:** [React Router v7](https://reactrouter.com/)
*   **Styling:** [Tailwind CSS v4](https://tailwindcss.com/)
*   **Iconography:** [Lucide React](https://lucide.dev/)
*   **Authentication:** `@react-oauth/google`

## 🏗 System Architecture

The codebase is organized modularly to promote reusability and maintainability. 

```text
JobSycnFronted/
├── public/                 # Static assets that bypass Webpack/Vite compilation
└── src/
    ├── components/         # Reusable, atomic UI components (Buttons, Cards, Modals)
    │   ├── Layout.tsx      # Main application shell and navigation wrapper
    │   └── LoginScreen.tsx # Authentication view
    ├── context/            # Global React Context providers
    │   └── UserContext.tsx # Centralized user state and authorization status
    ├── pages/              # Top-level Page components mapped to routes
    │   ├── Home.tsx        # Landing and marketing page
    │   ├── Dashboard.tsx   # Authenticated user control panel
    │   ├── Progress.tsx    # Application tracking and analytics
    │   └── CompanyDirectory.tsx # Market exploration view
    ├── hooks/              # Custom React Hooks
    ├── utils/              # Shared utility functions and formatting helpers
    ├── types/              # Global TypeScript interfaces and type definitions
    ├── App.tsx             # Root router configuration and guard logic
    └── main.tsx            # Initial React DOM render entry point
```

## 🚀 Getting Started

### Prerequisites

Ensure you have the following installed:
- Node.js (v18.x or higher)
- NPM or Yarn package manager

### Installation

1. Navigate to the frontend directory:
   ```bash
   cd JobSycnFronted
   ```
2. Install the necessary dependencies:
   ```bash
   npm install
   ```

### Configuration

Create a `.env` file in the root of the `JobSycnFronted` directory to hook into the backend API and external services.

```env
# API Configuration
# Points to the local development environment or production URL
VITE_API_URL=http://localhost:3000/api

# Authentication (If utilized directly on the client)
VITE_GOOGLE_CLIENT_ID=your_google_oauth_client_id
```

### Running the Application

To start the Vite development server with Hot Module Replacement (HMR):
```bash
npm run dev
```
*The application will boot instantly and typically runs on `http://localhost:5173`.*

## 💻 Available Scripts

*   `npm run dev` — Starts the development server.
*   `npm run build` — Executes the TypeScript compiler (`tsc -b`) to verify types, and then builds the optimized production bundle via Vite.
*   `npm run lint` — Runs ESLint across the codebase using strict, type-aware linting rules. 
*   `npm run preview` — Boots a local static server to preview the production build output located in the `/dist` directory.

## 🛡 State Management & Routing

*   **Context API:** Global state, specifically regarding the authenticated `User`, is managed via standard React Context, avoiding overhead from heavier state libraries (like Redux) while maintaining absolute truth across the application.
*   **Route Guards:** Protected routes (e.g., `/jobs`, `/progress`) programmatically check the `currentUser` context state. If a session is invalid or missing, React Router redirects the user to the `/login` entrypoint seamlessly.
