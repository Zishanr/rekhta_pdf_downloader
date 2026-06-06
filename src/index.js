import axios from "axios";

const PROXY_PORT = 4000;

const useProxy = () =>
    typeof window !== "undefined" &&
    (window.location.hostname === "localhost" ||
        window.location.hostname === "127.0.0.1");

const proxyUrl = (url, binary = false) => {
    const base = `http://localhost:${PROXY_PORT}/proxy?url=${encodeURIComponent(url)}`;
    return binary ? `${base}&binary=1` : base;
};

const fetchText = (url) =>
    useProxy() ? axios.get(proxyUrl(url)) : axios.get(url);

const fetchJson = (url) =>
    useProxy()
        ? axios.get(proxyUrl(url), { headers: { Accept: "application/json" } })
        : axios.get(url, { headers: { Accept: "application/json" } });

const imageSrc = (url) => (useProxy() ? proxyUrl(url, true) : url);

const findTextBetween = (source, start, end) => {
    return source.split(start)[1].split(end)[0].trim();
};

const stringToStringArray = (input) => {
    return input.split(",").map((item) => item.replace(/"/g, "").trim());
};

const unscrambleImage = (key, scrambledImageUrl) => {
    return new Promise((resolve, reject) => {
        const pageId = key.PageId;
        let originalHeight = key.PageHeight;
        let originalWidth = key.PageWidth;

        if (originalHeight <= 0) originalHeight = 1100;
        if (originalWidth <= 0) originalWidth = 1000;

        const tileSize = 50;
        const canvasWidth = originalWidth;
        const canvasHeight = originalHeight;

        const canvas = document.createElement("canvas");
        canvas.width = canvasWidth;
        canvas.height = canvasHeight;

        const ctx = canvas.getContext("2d");
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const img = new Image();
        img.crossOrigin = "anonymous";

        img.onload = () => {
            try {
                for (const sub of key.Sub) {
                    ctx.drawImage(
                        img,
                        sub.X1 * (tileSize + 16),
                        sub.Y1 * (tileSize + 16),
                        tileSize,
                        tileSize,
                        sub.X2 * tileSize,
                        sub.Y2 * tileSize,
                        tileSize,
                        tileSize
                    );
                }
                resolve({ canvas, width: canvasWidth, height: canvasHeight });
            } catch (error) {
                reject(error);
            }
        };

        img.onerror = () => reject(new Error(`Failed to load page image ${pageId}`));
        img.src = imageSrc(scrambledImageUrl);
    });
};

const downloadImage = async (keyUrl, scrambledImageUrl) => {
    const { data: key } = await fetchJson(keyUrl);
    return unscrambleImage(key, scrambledImageUrl);
};

const parseBookMeta = (pageContents) => {
    const parser = new DOMParser();
    const document = parser.parseFromString(pageContents, "text/html");
    const bookName = document.querySelector("span.c-book-name")?.innerText?.trim();
    const author = document
        .querySelector("span.faded")
        .innerText.replace(/\r?\n/g, "")
        .replace(/ +/g, " ")
        .replace("by ", "")
        .trim();
    const fileName = `${bookName} by ${author}`.trim().replace(/ +/g, " ").replace(/ /g, "-");

    const bookId = findTextBetween(pageContents, `var bookId = "`, `";`);
    const actualUrl = findTextBetween(pageContents, "var actualUrl =", ";");
    const bookSlug = findTextBetween(pageContents, "var bookslug ='", "';");
    const pageCount = parseInt(findTextBetween(pageContents, "var totalPageCount =", ";").trim());
    const pages = stringToStringArray(findTextBetween(pageContents, "var pages = [", "];"));
    const pageIds = stringToStringArray(findTextBetween(pageContents, "var pageIds = [", "];"));

    return { bookName, author, fileName, bookSlug, bookId, actualUrl, pageCount, pages, pageIds };
};

const bookDownload = async (url, { onProgress, onPage } = {}) => {
    const { data: pageContents } = await fetchText(url);
    const meta = parseBookMeta(pageContents);
    meta.url = url;

    for (let i = 0; i < meta.pageCount; i++) {
        const imgUrl = `https://ebooksapi.rekhta.org/images/${meta.bookId}/${meta.pages[i]}`;
        const key = `https://ebooksapi.rekhta.org/api_getebookpagebyid_websiteapp/?wref=from-site&&pgid=${meta.pageIds[i]}`;
        const page = await downloadImage(key, imgUrl);

        await onPage?.(page, i, meta);
        onProgress?.({
            current: i + 1,
            total: meta.pageCount,
            bookName: meta.bookName,
            author: meta.author,
        });
    }

    return meta;
};

const downloadBook = async (url, options) => {
    return bookDownload(url, options);
};

export default downloadBook;
