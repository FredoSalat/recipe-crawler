// Remove leading newline characters and dashes, whitespace and line breaks

export const textClean = (text) => {
  return text
    .trim()
    .replace(/^\s*–\s*/gm, "")
    .replace(/\n\s+/g, " ");
};
