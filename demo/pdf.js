import { jsPDF } from "jspdf";

export class PdfBuilder {
    constructor(fileName) {
        this.fileName = fileName;
        this.pdf = null;
    }

    addPage({ canvas, width, height }) {
        const orientation = width > height ? "landscape" : "portrait";

        if (!this.pdf) {
            this.pdf = new jsPDF({
                orientation,
                unit: "px",
                format: [width, height],
                hotfixes: ["px_scaling"],
                compress: true,
            });
        } else {
            this.pdf.addPage([width, height], orientation);
        }

        this.pdf.addImage(canvas, "JPEG", 0, 0, width, height, undefined, "FAST");

        canvas.width = 0;
        canvas.height = 0;
    }

    save() {
        if (!this.pdf) {
            throw new Error("No pages to export");
        }

        const blob = this.pdf.output("blob");
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = `${this.fileName}.pdf`;
        link.click();
        URL.revokeObjectURL(link.href);
        this.pdf = null;
    }
}

export const canvasToPage = (canvas, width, height) => ({
    canvas,
    width,
    height,
});
