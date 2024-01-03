// Remove leading newline characters and dashes, whitespace and line breaks

export const sanitizeText = (text) => {
  return text
    .trim()
    .replace(/^\s*–\s*/gm, "")
    .replace(/\s+/g, " ")
    .replace(/^[,\s]+|[,\s]+$/g, "");
};
