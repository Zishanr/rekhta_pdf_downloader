# rekhta-downloader-js

Downloader for Rekhta books — paste an ebook URL and save the full book as a PDF.

[![Node.js Package](https://github.com/inshapardaz/rekhta-downloader-js/actions/workflows/npm-publish.yml/badge.svg)](https://github.com/inshapardaz/rekhta-downloader-js/actions/workflows/npm-publish.yml)

## Local website

Run the local downloader UI:

```bash
npm install
npm start
```

Then open the URL shown in the terminal (usually `http://localhost:1234`).

1. Paste a Rekhta ebook URL (e.g. `https://www.rekhta.org/ebooks/...`)
2. Click **Download as PDF**
3. Wait while pages are fetched — progress is shown on screen
4. The PDF saves automatically to your Downloads folder

The start command runs two services:

- **Web UI** (Parcel) — the page you use in the browser
- **Proxy** (port 4000) — avoids CORS issues when fetching from Rekhta

## Install as a library

```bash
npm install --save rekhta-downloader-js
```

```javascript
import downloadBook from "rekhta-downloader-js";

const book = await downloadBook(url, ({ current, total, bookName }) => {
  console.log(`${bookName}: page ${current}/${total}`);
});

// book.pageImages — array of { dataUrl, width, height }
```
