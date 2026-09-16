# Frontend - Fake Review Analyzer

React-based frontend application for the Fake Review Analyzer.

## Features

- **Home Page**: Project overview and feature showcase
- **Review Analyzer**: 
  - Manual review entry
  - URL-based product analysis
- **Results Dashboard**: 
  - Trust score visualization
  - Detailed analysis breakdown
  - Flag and issue identification

## Project Structure

```
frontend/
├── public/
│   └── index.html
├── src/
│   ├── components/
│   │   ├── Navbar.js
│   │   └── Navbar.css
│   ├── pages/
│   │   ├── Home.js
│   │   ├── Home.css
│   │   ├── Analyzer.js
│   │   ├── Analyzer.css
│   │   ├── Results.js
│   │   └── Results.css
│   ├── services/
│   │   └── api.js          # API integration
│   ├── App.js
│   ├── App.css
│   ├── index.js
│   └── index.css
├── package.json
├── .env.example
└── README.md
```

## Installation

```bash
npm install
```

## Configuration

Create `.env` file from `.env.example`:
```
REACT_APP_API_URL=http://localhost:5000/api
```

## Running

```bash
npm start
```

Runs on `http://localhost:3000`

## Build

```bash
npm run build
```

Creates optimized production build in `build/` directory.

## Components

### Navbar
Navigation component with links to main pages.

### Pages
- **Home**: Landing page with feature overview
- **Analyzer**: Form for entering reviews or product URLs
- **Results**: Display analysis results and trust score

### Services
- **api.js**: Handles all API communication with backend

## Styling

Uses CSS with responsive design. Colors and themes can be customized in CSS files.

- Primary color: #667eea (Purple)
- Secondary color: #764ba2 (Dark purple)

## Dependencies

- react 18.2.0
- react-dom 18.2.0
- react-router-dom 6.10.0
- axios 1.3.0
- chart.js 3.9.1 (for future analytics)

## Future Enhancements

- [ ] Add chart visualization for review distribution
- [ ] Implement URL scraping for product pages
- [ ] Add user authentication
- [ ] Build comparison feature for multiple products
- [ ] Add export functionality for analysis results
- [ ] Implement dark mode
