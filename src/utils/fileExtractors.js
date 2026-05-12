export const extractTextFromPDF = async (file) => {
  try {
    const pdfjsLib = await import('pdfjs-dist');
    pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
      'pdfjs-dist/build/pdf.worker.min.mjs',
      import.meta.url
    ).toString();

    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    let fullText = '';

    for (let i = 1; i <= Math.min(pdf.numPages, 50); i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      const pageText = content.items.map(item => item.str).join(' ');
      fullText += pageText + '\n\n';
    }

    if (!fullText.trim()) return null;
    return fullText.substring(0, 50000);
  } catch (error) {
    console.error('PDF extraction error:', error);
    return null;
  }
};

export const extractTextFromDocx = async (file) => {
  try {
    const mammoth = await import('mammoth');
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer });
    const text = result.value;
    if (!text.trim()) return null;
    return text.substring(0, 50000);
  } catch (error) {
    console.error('DOCX extraction error:', error);
    return null;
  }
};

export const fileToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

export const getFileType = (file) => {
  const ext = file.name.split('.').pop()?.toLowerCase();
  if (ext === 'pdf') return 'pdf';
  if (['docx'].includes(ext)) return 'docx';
  if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) return 'image';
  return 'unknown';
};

export const extractTextFromFile = async (file) => {
  const type = getFileType(file);
  switch (type) {
    case 'pdf':
      return { text: await extractTextFromPDF(file), type: 'pdf' };
    case 'docx':
      return { text: await extractTextFromDocx(file), type: 'docx' };
    case 'image':
      return { text: await fileToBase64(file), type: 'image' };
    default:
      return { text: null, type: 'unknown' };
  }
};
