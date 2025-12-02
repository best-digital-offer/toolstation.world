# ToolStation.world

Free online tools for everyday tasks. Word counter, QR code generator, image compressor, calculators, and more.

## 🚀 GitHub Pages Deployment

This project is configured for automatic deployment to GitHub Pages using GitHub Actions.

### Setup Instructions:

1. **Push to GitHub**: Push this repository to your GitHub account
2. **Enable GitHub Pages**: 
   - Go to repository Settings → Pages
   - Source: Deploy from a branch
   - Branch: Select "main" and "/ (root)"
   - Click Save
3. **Enable GitHub Actions**:
   - Go to repository Settings → Actions → General
   - Allow all actions and reusable workflows
4. **Automatic Deployment**: The site will automatically deploy when you push to the main branch

### Features:
- ✅ GitHub Pages ready
- ✅ GitHub Actions workflow included
- ✅ Service Worker for offline functionality
- ✅ SEO optimized
- ✅ Mobile responsive
- ✅ No build process required

### Tools Included:
- Word Counter
- Text Case Converter
- QR Code Generator
- Image Compressor
- JPG ↔ PNG Converter
- Image to PDF
- BMI Calculator
- EMI Calculator
- YouTube Thumbnail Finder

## 📁 Project Structure

```
├── .github/workflows/static.yml  # GitHub Actions deployment
├── assets/                       # CSS, JS, and other assets
├── tools/                        # Individual tool pages
├── index.html                    # Homepage
├── .nojekyll                     # Prevents Jekyll processing
└── sw.js                         # Service Worker
```

## 🔧 Customization

- Update `assets/style.css` for styling changes
- Modify `assets/main.js` for JavaScript functionality
- Add new tools in the `tools/` directory
- Update SEO meta tags in HTML files

## 📱 Browser Support

Works on all modern browsers including Chrome, Firefox, Safari, and Edge.