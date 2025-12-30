import { loadPdfJs } from './pdfWorkerLoader';

export interface PdfConversionResult {
    imageUrl: string;
    file: File | null;
    error?: string;
}

export async function convertPdfToImage(
    file: File
): Promise<PdfConversionResult> {
    try {
        // Load PDF.js with worker
        const pdfjs = await loadPdfJs();
        if (!pdfjs) {
            throw new Error('Failed to load PDF.js');
        }

        const arrayBuffer = await file.arrayBuffer();
        const loadingTask = pdfjs.getDocument({ data: arrayBuffer });
        const pdf = await loadingTask.promise;

        if (!pdf.numPages) {
            throw new Error('No pages found in PDF');
        }

        const page = await pdf.getPage(1);
        const viewport = page.getViewport({ scale: 2.0 }); // Reduced scale for better performance

        // Create canvas
        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d");

        if (!context) {
            throw new Error('Failed to get canvas context');
        }

        canvas.width = viewport.width;
        canvas.height = viewport.height;
        canvas.style.width = `${viewport.width}px`;
        canvas.style.height = `${viewport.height}px`;

        // Set canvas rendering context properties
        context.imageSmoothingEnabled = true;
        context.imageSmoothingQuality = "high";

        // Render PDF page to canvas
        const renderContext = {
            canvasContext: context,
            viewport: viewport
        };

        await page.render(renderContext).promise;

        // Clean up PDF
        pdf.destroy();

        return new Promise((resolve) => {
            canvas.toBlob(
                (blob) => {
                    if (blob) {
                        const originalName = file.name.replace(/\.pdf$/i, "");
                        const imageFile = new File([blob], `${originalName}.png`, {
                            type: "image/png",
                        });

                        resolve({
                            imageUrl: URL.createObjectURL(blob),
                            file: imageFile,
                        });
                    } else {
                        resolve({
                            imageUrl: "",
                            file: null,
                            error: "Failed to create image blob",
                        });
                    }
                },
                "image/png",
                0.95 // Slightly reduced quality for smaller file size
            );
        });
    } catch (err) {
        console.error("PDF conversion error:", err);
        return {
            imageUrl: "",
            file: null,
            error: `Failed to convert PDF: ${err}`,
        };
    }
}