const XML_INVALID_CHARS = /[\x00-\x08\x0B\x0C\x0E-\x1F\uFFFE\uFFFF]/g;
const SURROGATES = /[\uD800-\uDFFF]/g;

export const sanitizeXmlText = (text) => {
  if (typeof text !== 'string') return text || '';
  return text.replace(XML_INVALID_CHARS, '').replace(SURROGATES, '');
};

export default sanitizeXmlText;
