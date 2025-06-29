# 🔍 Mozi - Intelligent GitHub Issue Analyzer

> **Automatically analyze and rank your GitHub issues by fixability to focus on what matters most.**

Mozi is a full-stack web application that intelligently analyzes GitHub issues across your repositories and ranks them by how likely they are to be fixable. Built on Cloudflare Workers with a modern tech stack, it provides automated insights to help developers prioritize their work.

![GitHub](https://img.shields.io/badge/github-%23121011.svg?style=for-the-badge&logo=github&logoColor=white)
![TypeScript](https://img.shields.io/badge/typescript-%23007ACC.svg?style=for-the-badge&logo=typescript&logoColor=white)
![Cloudflare](https://img.shields.io/badge/Cloudflare-F38020?style=for-the-badge&logo=Cloudflare&logoColor=white)

## ✨ Features

### 🎯 **Intelligent Issue Analysis**
- **Smart Scoring Algorithm**: Analyzes issue content, labels, stack traces, and context
- **Fixability Ranking**: Issues categorized as High, Medium, Low, or Very Low fixability
- **Context Gathering**: Automatically finds related files, code references, and discussions
- **Rule-Based Analysis**: Multiple criteria including bug indicators, error messages, and code mentions

### 🔄 **Automated Processing**
- **Scheduled Analysis**: Hourly cron jobs automatically process new issues
- **Manual Refresh**: On-demand analysis with real-time progress indicators
- **Repository Management**: Easy addition and configuration of multiple repositories
- **Persistent Storage**: All analysis results stored in Cloudflare D1 database

### 🎨 **Modern Web Interface**
- **Repository Filtering**: View issues for specific repositories or all at once
- **GitHub-like Styling**: Familiar interface with clean, professional design
- **Real-time Loading**: Smart loading states and progress indicators
- **Responsive Design**: Works seamlessly across desktop and mobile devices

### 📊 **Comprehensive Insights**
- **Detailed Recommendations**: Specific advice for each issue based on analysis
- **Context Metrics**: Shows related files, code references, and comment counts
- **Applied Rules**: Transparent scoring with explanation of analysis factors
- **Direct GitHub Links**: One-click access to original issues

## 🏗️ System Architecture

### **Technology Stack**
```
┌─────────────────────────────────────────────────────────────┐
│                     🌐 Frontend (Preact)                    │
│                Static files served via Cloudflare           │
├─────────────────────────────────────────────────────────────┤
│                   ⚡ Cloudflare Worker (Hono)               │
│              REST API + Static Asset Serving                │
├─────────────────────────────────────────────────────────────┤
│                    🗄️ Cloudflare D1 Database               │
│              SQLite with Drizzle ORM                        │
├─────────────────────────────────────────────────────────────┤
│                   🔧 External Services                      │
│                GitHub API + Cron Triggers                   │
└─────────────────────────────────────────────────────────────┘
```

### **Core Components**

#### **Backend Services (`src/services/`)**
- **`github.ts`**: GitHub API integration and issue context gathering
- **`analysis.ts`**: Fixability scoring algorithm and rule engine
- **`cronjob.ts`**: Automated scheduled processing service

#### **API Routes (`src/routes/`)**
- **`/api/issues`**: Get issues with optional repository filtering
- **`/api/repositories`**: Manage tracked repositories
- **`/api/refresh`**: Trigger manual analysis
- **`/`**: Static frontend application

#### **Database Schema (`src/db/`)**
- **`repositories`**: Tracked GitHub repositories
- **`issues`**: Analyzed issues with scores and metadata
- **`settings`**: Application configuration

## 🚀 Quick Start

### **Prerequisites**
- Node.js 24+
- pnpm package manager
- GitHub Personal Access Token
- Cloudflare account (for deployment)

### **Local Development**

1. **Clone and Install**
   ```bash
   git clone <repository-url>
   cd mozi
   pnpm install
   ```

2. **Database Setup**
   ```bash
   # Apply database migrations
   pnpm db:migrate
   ```

3. **Environment Configuration**
   ```bash
   # Edit wrangler.toml and add your GitHub token
   [vars]
   GITHUB_TOKEN = "your_github_personal_access_token"
   ```

4. **Start Development**
   ```bash
   # Build frontend
   pnpm build:client
   
   # Start Cloudflare Worker
   pnpm dev
   ```

5. **Access Application**
   - Frontend: `http://localhost:8787`
   - API: `http://localhost:8787/api/*`

### **Adding Repositories**

1. Open the web interface at `http://localhost:8787`
2. Use the "Repository Settings" section to add repositories
3. Enter repository in format: `owner/repo` (e.g., `facebook/react`)
4. Click "Add Repository"
5. Use "Refresh Issues" to start analysis

## 🔧 Configuration

### **GitHub Token Setup**
1. Go to GitHub Settings → Developer settings → Personal access tokens
2. Generate token with `repo` and `read:org` permissions
3. Add token to `wrangler.toml`:
   ```toml
   [vars]
   GITHUB_TOKEN = "github_pat_..."
   ```

### **Database Management**
```bash
# Generate new migrations
pnpm db:generate

# Apply migrations
pnpm db:migrate

# Open database studio
pnpm db:studio
```

### **Cron Schedule**
The application runs analysis every hour by default. Configure in `wrangler.toml`:
```toml
[triggers]
crons = ["0 * * * *"]  # Every hour
```

## 📚 Usage Guide

### **Managing Repositories**
1. **Add Repository**: Enter `owner/repo` format in the form
2. **Enable/Disable**: Toggle repository processing (planned feature)
3. **View Issues**: Use repository filter dropdown to focus on specific repos

### **Understanding Fixability Scores**

| Level | Score Range | Indicators |
|-------|-------------|------------|
| 🟢 **High** | 70-100% | Clear bug reports, stack traces, specific file references |
| 🟡 **Medium** | 40-69% | Good context, some error info, moderate complexity |
| 🟠 **Low** | 20-39% | Limited context, vague descriptions, unclear requirements |
| 🔴 **Very Low** | 0-19% | Questions, discussions, external dependencies |

### **Analysis Rules**
- **Positive Factors**: Bug labels, error messages, stack traces, code references
- **Negative Factors**: Feature requests without context, questions, duplicates
- **Context Gathering**: Related files, code searches, comment analysis

## 🚢 Deployment

### **Cloudflare Workers**
```bash
# Build and deploy
pnpm deploy

# Deploy to production
wrangler deploy --env production
```

### **Environment Variables**
Set these in Cloudflare Dashboard or `wrangler.toml`:
- `GITHUB_TOKEN`: GitHub Personal Access Token
- `DB`: D1 Database binding (auto-configured)

## 🛠️ Development

### **Project Structure**
```
mozi/
├── src/
│   ├── index.ts              # Worker entry point
│   ├── routes/               # API route handlers
│   ├── services/             # Business logic
│   ├── db/                   # Database schema
│   └── app/                  # Frontend Preact app
├── public/                   # Static HTML
├── dist/                     # Built frontend assets
├── migrations/               # Database migrations
└── wrangler.toml            # Cloudflare Worker config
```

### **Available Scripts**
```bash
pnpm dev              # Start development server
pnpm build:client     # Build frontend
pnpm deploy           # Build and deploy
pnpm db:migrate       # Apply database migrations
pnpm db:studio        # Open database studio
```

### **Testing**
```bash
# Test API endpoints
node test-new-features.js

# Test application structure
node test-new-structure.js
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Run tests and ensure build passes
5. Commit your changes (`git commit -m 'Add amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

## 📝 License

This project is licensed under the ISC License - see the LICENSE file for details.

## 🐛 Issues & Support

- **Bug Reports**: Open an issue with detailed description
- **Feature Requests**: Describe the feature and use case
- **Questions**: Use GitHub Discussions for general questions

## 🙏 Acknowledgments

- Built with [Cloudflare Workers](https://workers.cloudflare.com/)
- Powered by [Hono](https://hono.dev/) web framework
- Frontend built with [Preact](https://preactjs.com/)
- Database managed with [Drizzle ORM](https://orm.drizzle.team/)
- Styled with GitHub-inspired design principles

---

**Made with ❤️ for developers who want to focus on what matters most.**