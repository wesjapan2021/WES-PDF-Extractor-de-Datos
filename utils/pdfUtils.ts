
// This assumes pdfjsLib is available on the window object
// @ts-ignore
const pdfjsLib = window.pdfjsLib;

export const extractTextFromPdf = async (file: File): Promise<string> => {
  const fileReader = new FileReader();

  return new Promise((resolve, reject) => {
    fileReader.onload = async (event) => {
      if (!event.target?.result) {
        return reject(new Error("Failed to read file"));
      }
      if (!pdfjsLib) {
        return reject(new Error("PDF.js library is not loaded."));
      }
      try {
        const typedArray = new Uint8Array(event.target.result as ArrayBuffer);
        const pdf = await pdfjsLib.getDocument(typedArray).promise;
        let fullText = "";
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const textContent = await page.getTextContent();
          const pageText = textContent.items.map((item: any) => item.str).join(" ");
          fullText += pageText + "\n\n";
        }
        resolve(fullText);
      } catch (error) {
        console.error("Error processing PDF:", error);
        reject(new Error("Could not process the PDF file. It might be corrupted or in an unsupported format."));
      }
    };
    fileReader.onerror = (error) => reject(error);
    fileReader.readAsArrayBuffer(file);
  });
};
