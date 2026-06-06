import downloadBook from "../src";
import { PdfBuilder } from "./pdf";

const form = document.getElementById("download-form");
const submitBtn = document.getElementById("submit-btn");
const statusEl = document.getElementById("status");
const progressEl = document.getElementById("progress");
const progressFill = document.getElementById("progress-fill");
const progressLabel = document.getElementById("progress-label");

form.addEventListener("submit", onFormSubmit);

function setStatus(message, type = "") {
    statusEl.textContent = message;
    statusEl.className = `status${type ? ` ${type}` : ""}`;
}

function setProgress(current, total, bookName, phase = "Downloading") {
    progressEl.classList.add("visible");
    const percent = Math.round((current / total) * 100);
    progressFill.style.width = `${percent}%`;
    progressLabel.textContent = bookName
        ? `${phase} "${bookName}" — page ${current} of ${total}`
        : `${phase} page ${current} of ${total}`;
}

async function onFormSubmit(e) {
    e.preventDefault();

    const url = new FormData(form).get("url").trim();
    submitBtn.disabled = true;
    progressEl.classList.remove("visible");
    progressFill.style.width = "0%";
    setStatus("Fetching book details…");

    let pdf = null;

    try {
        const book = await downloadBook(url, {
            onPage: (page, _index, meta) => {
                if (!pdf) {
                    pdf = new PdfBuilder(meta.fileName);
                }
                pdf.addPage(page);
            },
            onProgress: ({ current, total, bookName }) => {
                const phase = current === total ? "Finishing" : "Downloading";
                setProgress(current, total, bookName, phase);
                setStatus(`${phase === "Finishing" ? "Saving" : "Downloading"} pages…`);
            },
        });

        if (!pdf) {
            throw new Error("No pages were downloaded");
        }

        setStatus("Saving PDF…");
        pdf.save();

        setStatus(`Saved "${book.bookName}" as ${book.fileName}.pdf`, "success");
    } catch (error) {
        console.error(error);
        setStatus(error.message || "Download failed. Check the URL and try again.", "error");
    } finally {
        submitBtn.disabled = false;
    }
}
