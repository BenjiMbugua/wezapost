# WezaPost - AI-Powered Social Media Management Tool

A personal, self-hosted social media management tool for individual content creators to efficiently schedule, repurpose, and analyze content across multiple platforms with AI video generation capabilities.

## 🎯 Vision
Eliminate the need for expensive SaaS solutions ($100-500/month) while providing complete data ownership, privacy, and customization for personal social media workflows.

## ✅ Phase 1: Foundation & Infrastructure (COMPLETE)

### Core Setup
- ✅ Next.js 14+ with TypeScript
- ✅ Custom OKLCH color system with cyan theme
- ✅ Source Code Pro monospace typography
- ✅ Tailwind CSS with custom configuration
- ✅ Component library foundation (Button, Card, Badge, Input)
- ✅ Dark/light mode toggle with theme transitions
- ✅ Responsive design system
- ✅ Development environment with Docker support

### Architecture
- **Frontend**: Next.js 14+ (TypeScript, App Router)
- **Styling**: Tailwind CSS with custom OKLCH theme
- **Typography**: Monospace fonts for developer aesthetic
- **Theme**: Custom cyan/blue color palette with smooth transitions
- **Components**: Modular, reusable UI component library

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- npm/pnpm
- Docker (optional)

### Installation

1. **Clone and install dependencies:**
```bash
npm install
```

2. **Set up environment variables:**
```bash
cp .env.example .env.local
# Edit .env.local with your configuration
```

3. **Start development server:**
```bash
npm run dev
```

4. **Visit:** `http://localhost:3000`

### Docker Development
```bash
docker-compose -f docker-compose.dev.yml up
```

## 🎨 Design System

### Color Palette (OKLCH)
- **Light Theme**: Cyan-tinted grays with blue undertones
- **Dark Theme**: Deep blue-grays with bright cyan accents
- **Typography**: Source Code Pro monospace for technical aesthetic
- **Radius**: Minimal (0.125rem) for clean, modern look

### Theme Features
- ✅ Smooth 300ms transitions between themes
- ✅ System preference detection
- ✅ Persistent theme selection
- ✅ Proper contrast ratios (WCAG AA)

## 📋 Implementation Plan

### Phase 2: Core Features & Social Media Integration (Pending)
- [ ] Supabase database setup
- [ ] Authentication system (Supabase Auth)
- [ ] Social media OAuth (Twitter, LinkedIn)
- [ ] Basic posting functionality
- [ ] Media upload and management

### Phase 3: Scheduling & Automation System (Pending)
- [ ] Redis queue system
- [ ] Post scheduling engine
- [ ] Interactive calendar interface
- [ ] Automated posting with retry logic

### Phase 4: AI Integration & Content Generation (Pending)
- [ ] Google Cloud Vertex AI setup
- [ ] Veo 3 video generation integration
- [ ] OpenAI/Claude text content optimization
- [ ] AI job queue and status tracking

### Phase 5: Analytics & Reporting (Pending)
- [ ] Social media analytics collection
- [ ] Performance dashboard
- [ ] Report generation (PDF/CSV)
- [ ] Growth tracking and insights

### Phase 6: Polish & Advanced Features (Pending)
- [ ] Performance optimization
- [ ] PWA features
- [ ] Advanced automation
- [ ] Mobile responsiveness

## 🛠 Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run type-check` - Run TypeScript checking

## 📁 Project Structure

```
src/
├── app/                 # Next.js 14 app directory
├── components/          # React components
│   ├── ui/             # Base UI components
│   ├── layout/         # Layout components
│   └── features/       # Feature-specific components
├── lib/                # Utilities and configurations
├── styles/             # Global styles and themes
├── types/              # TypeScript definitions
├── hooks/              # Custom React hooks
└── stores/             # State management
```

## 🎯 Success Criteria

### Technical Metrics
- [ ] 99%+ uptime for scheduled posting
- [ ] <2 second page load times
- [ ] <10 second post publishing time
- [ ] Support for 50+ posts per day

### Feature Metrics
- [ ] All primary platforms connected (Twitter, LinkedIn)
- [ ] AI video generation functional
- [ ] Scheduling system handles 100+ posts/week
- [ ] Analytics provide actionable insights

## 📄 License

Private project for personal use.

---

**Current Status**: Phase 1 Complete ✅  
**Next Milestone**: Phase 2 - Core Features & Social Media Integration  
**Estimated Total Duration**: 12-14 weeks (64-76 development days)