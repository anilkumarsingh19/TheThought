# TheThought - Social Media Platform

A modern social media platform for sharing thoughts and short videos, built with HTML, CSS, JavaScript, and Node.js.

## Features

- 🏠 **Home Feed**: Share thoughts and view global timeline
- 🔍 **Search**: Find users, posts, and content
- 🎥 **Reels**: Upload and share short videos
- 💬 **Messages**: Direct messaging between users
- 👤 **Profile**: Complete profile management with stats
- ⚙️ **Settings**: Themes, privacy, and account management

## Tech Stack

### Frontend
- HTML5, CSS3, JavaScript (ES6+)
- Responsive design with CSS Grid and Flexbox
- Local storage for offline functionality

### Backend
- Node.js with Express.js
- MongoDB for database
- JWT for authentication
- Multer for file uploads

## Getting Started

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (local or cloud)
- Git

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/thethought.git
cd thethought
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your configuration
```

4. Start the development server:
```bash
npm run dev
```

5. Open your browser and visit `http://localhost:3000`

## Deployment

### Frontend (GitHub Pages)
The frontend is automatically deployed to GitHub Pages when you push to the main branch.

### Backend (Vercel/Netlify)
The backend API is deployed using Vercel for serverless functions.

## Project Structure

```
thethought/
├── frontend/          # Frontend files
│   ├── index.html
│   ├── style.css
│   └── script.js
├── backend/           # Backend API
│   ├── routes/
│   ├── models/
│   ├── middleware/
│   └── server.js
├── public/            # Static assets
└── docs/              # Documentation
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Contact

Your Name - [@yourusername](https://github.com/yourusername)
Project Link: [https://github.com/yourusername/thethought](https://github.com/yourusername/thethought)