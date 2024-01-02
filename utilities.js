// Remove leading newline characters and dashes

export const textClean = (text) => {
  return text.replace(/^\s*–\s*/gm, "");
};
