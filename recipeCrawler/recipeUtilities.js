// Remove leading newline characters and dashes, whitespace and line breaks
export const sanitize = (text) => {
  return text.replace(/\s+/g, " ");
};

export const extractIngredient = async (element) => {
  // Extracting ingredient text content excluding <span> elements

  const ingredientElement = await element.evaluate((tdElement) => {
    const spanElements = tdElement.querySelectorAll("span");
    spanElements.forEach((spanElement) => {
      spanElement.remove();
    });
    return tdElement.textContent;
  });

  return ingredientElement;
};
