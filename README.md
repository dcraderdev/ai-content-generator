# AI Content Generator

A standalone, plug-and-play AI content and image generation tool. Generate text content with Claude and images with Replicate (Recraft, Flux, Ideogram).

## Features

- **Text Generation**: Generate structured content using Claude (recipes, products, blog posts, etc.)
- **Image Generation**: Create images with Replicate models (Recraft V3, Flux 1.1 Pro, Ideogram V3)
- **Image Optimization**: Automatic WebP/JPEG optimization with Sharp
- **Local Storage**: Save optimized images to disk
- **User Auth**: Basic JWT authentication system
- **Content Storage**: SQLite database for generated content

## Quick Start

### 1. Clone and Install

```bash
git clone https://github.com/yourusername/ai-content-generator.git
cd ai-content-generator

# Install all dependencies
npm run install:all
```

### 2. Configure Environment

```bash
# Copy example env files
cp .env.example .env
cp frontend/.env.example frontend/.env.local
cp backend/.env.example backend/.env

# Edit .env files with your API keys
```

**Required API Keys:**
- `ANTHROPIC_API_KEY` - Get from [Anthropic Console](https://console.anthropic.com/)
- `REPLICATE_API_KEY` - Get from [Replicate](https://replicate.com/account/api-tokens)

### 3. Run Development Server

```bash
# Start both frontend and backend
npm run dev
```

- Frontend: http://localhost:4000
- Backend: http://localhost:8000

### 4. Start Generating!

1. Go to http://localhost:4000/admin/generate
2. Select a content theme
3. Click "Generate Content"
4. Click "Generate Image"
5. Click "Save to Database"

## Project Structure

```
ai-content-generator/
├── frontend/                 # Next.js app (port 4000)
│   ├── app/
│   │   ├── admin/generate/  # Main generation UI
│   │   ├── api/             # API routes
│   │   └── auth/            # Login/register pages
│   ├── lib/
│   │   ├── ai/              # AI service integrations
│   │   └── imageOptimization.ts
│   └── public/generated/    # Optimized images saved here
│
├── backend/                  # Express API (port 8000)
│   ├── routes/api/
│   │   ├── session.js       # Auth endpoints
│   │   └── content.js       # Content CRUD
│   ├── db/models/
│   │   ├── User.js
│   │   └── GeneratedContent.js
│   └── middleware/auth.js
│
└── templates/               # Content type templates (customize)
    └── recipe/
```

## API Endpoints

### Frontend (Next.js API Routes)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/generate/text` | POST | Generate text with Claude |
| `/api/generate/image` | POST | Generate image with Replicate |
| `/api/optimize-image` | POST | Optimize and save image locally |

### Backend (Express)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/session/register` | POST | Create account |
| `/api/session/login` | POST | Login |
| `/api/session/logout` | DELETE | Logout |
| `/api/session/current` | GET | Get current user |
| `/api/content` | GET | List content |
| `/api/content` | POST | Create content |
| `/api/content/:id` | GET | Get single content |
| `/api/content/:id` | PUT | Update content |
| `/api/content/:id` | DELETE | Delete content |

## Customization

### Adding New Content Types

1. Add theme to `CONTENT_THEMES` in `/frontend/app/admin/generate/page.tsx`
2. Customize the prompt in `buildDefaultPrompt()` function
3. Add a new template folder in `/templates/[type]/`

### Using Different Image Models

Available models in `/frontend/lib/ai/replicate.ts`:
- `recraft-v3` - Best quality, realistic images
- `flux-1.1-pro` - Fast, good quality
- `flux-1.1-pro-ultra` - Highest resolution
- `ideogram-v3` - Best prompt adherence
- `flux-schnell` - Fastest, cheapest

### Changing Image Sizes

Edit `/frontend/lib/imageOptimization.ts`:
```javascript
const IMAGE_CONFIG = {
  fullSize: { width: 1200, height: 675 },
  thumbnail: { width: 400, height: 225 },
  hero: { width: 1920, height: 1080 },
  square: { width: 1024, height: 1024 },
};
```

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `ANTHROPIC_API_KEY` | Yes | Claude API key |
| `REPLICATE_API_KEY` | Yes | Replicate API key |
| `JWT_SECRET` | Yes | Secret for JWT tokens |
| `FRONTEND_URL` | No | CORS origin (default: localhost:4000) |
| `PORT` | No | Backend port (default: 8000) |

## Tech Stack

- **Frontend**: Next.js 14, React 18, TypeScript
- **Backend**: Express.js, Sequelize ORM
- **Database**: SQLite (dev), easily swap to PostgreSQL
- **AI**: Anthropic Claude, Replicate (Recraft, Flux, Ideogram)
- **Image Processing**: Sharp

## License

MIT
