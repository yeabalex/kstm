# @kstm/web — Next.js 15 Frontend Application

Modern web application for KSTM. Enables users to upload multi-modal knowledge bases, configure and customize domain-specific AI bots, view real-time training progress, and engage in multi-session conversations with source-attributed RAG responses.

---

## Tech Stack

- **Framework**: [Next.js 15](https://nextjs.org/) (App Router, React 18/19)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) with zinc modern design system
- **UI Components**: [Radix UI](https://www.radix-ui.com/) & Lucide React
- **Animations**: [Framer Motion](https://www.framer.com/motion/)
- **Markdown & Code Rendering**: `react-markdown` with syntax styling
- **State & Context**: React Context with authenticated session management

---

## Key Features

- **Document Ingestion Hub**: Drag-and-drop file upload supporting PDF, CSV, JSON, TXT, and dynamic URL inputs.
- **Bot Persona Studio**: Custom system prompts with dynamic `{{context}}` templating, model selection (Gemini 2.5 Flash), temperature slider, and access control (public vs. private).
- **Real-Time Indexing Progress**: Multi-step loader polling BullMQ status from the backend.
- **Interactive Chat Interface**: Multi-session conversational UI with history sidebar, Markdown rendering, auto-scrolling, and copy-to-clipboard actions.
- **Subscription & Usage Dashboard**: Real-time credit monitoring and bot management view.

---

## Development

This package is managed inside the KSTM Turborepo monorepo.

### Local Setup

```bash
# Start development server on port 8080
pnpm --filter @kstm/web run dev

# Production build
pnpm --filter @kstm/web run build

# Run linter
pnpm --filter @kstm/web run lint
```

### Environment Variables

Configure `.env` inside `apps/web/`:

```env
JWT_SECRET="your-jwt-secret-here"
NEXT_PUBLIC_API_URL="http://localhost:3000"
NEXT_PUBLIC_SITE_URL="http://localhost:8080"
```
