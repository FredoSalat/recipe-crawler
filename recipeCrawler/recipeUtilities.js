// Remove leading newline characters and dashes, whitespace and line breaks
export const sanitize = (text) => {
  return text.trim().replace(/\s+/g, " ");
};

export const extractIngredients = async (ingredientElements) => {
  const ingredients = await Promise.all(
    ingredientElements.map(async (divElement) => {
      const fragmentedIngredients = await divElement.$$("span");
      const rawIngredient = await Promise.all(
        fragmentedIngredients.map(async (fragmentedIngredient) => {
          return await fragmentedIngredient.textContent();
        })
      );
      const unsanitizedIngredient = rawIngredient.join(" ");

      const ingredient = sanitize(unsanitizedIngredient);

      return ingredient;
    })
  );
  return ingredients.filter((ingredient) => ingredient !== "");
};
