// pdfWorkerLoader.ts
let pdfjsLib: any = null;
let pdfWorker: any = null;

export async function loadPdfJs() {
    if (pdfjsLib) return pdfjsLib;

    // Dynamically import PDF.js
    const pdfjs = await import('pdfjs-dist');
    pdfjsLib = pdfjs;

    // Set up worker from local file
    if (typeof window !== 'undefined') {
        // Use the worker from pdfjs-dist package
        const workerSrc = new URL(
            'pdfjs-dist/build/pdf.worker.min.mjs',
            import.meta.url
        ).toString();

        pdfjs.GlobalWorkerOptions.workerSrc = workerSrc;
    }

    return pdfjsLib;
}