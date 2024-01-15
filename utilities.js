// Remove leading newline characters and dashes, whitespace and line breaks

const sanitize = (text) => {
  return text
    .trim()
    .replace(/^\s*–\s*/gm, "")
    .replace(/\s+/g, " ")
    .replace(/^[,\s]+|[,\s]+$/g, "");
};

const extractIngredient = async (element) => {
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

export const getTitle = async (page, requestURL) => {
  const titleElement = await page.locator(".c-recipe__title");

  if (!titleElement) {
    throw new Error(`Title not found on this page ${requestURL}`);
  }

  const rawTitle = await titleElement.textContent();

  const title = sanitize(rawTitle);

  return title;
};

export const getImage = async (page, requestURL) => {
  const imageElements = await page.$$(".c-recipe__image > picture > img");

  if (!imageElements || imageElements.length === 0) {
    throw new Error(`Images not found on this page ${requestURL}`);
  }

  const imageElement = imageElements[0];

  if (!imageElement) {
    throw new Error(`Image not found on this page ${requestURL}`);
  }

  const rawImageURL = await imageElement.getAttribute("src");

  if (!rawImageURL) {
    throw new Error("Raw Image URL not found on this page");
  }

  const imageURL = rawImageURL.split("?")[0];

  if (!imageURL) {
    throw new Error(`Image URL not found on this page ${requestURL}`);
  }

  return imageURL;
};

export const getIngredients = async (page, requestURL) => {
  const ingredientElements = await page.$$(".recipe-page-body__ingredients");

  if (!ingredientElements) {
    throw new Error(`Ingredients not found on this page ${requestURL}`);
  }

  const ingredients = await Promise.all(
    ingredientElements.map(async (element, index) => {
      const rawPreparation = await ingredientElements[index].textContent();

      const preparation = sanitize(rawPreparation);

      const ingredientElement = await extractIngredient(element);

      const ingredient = sanitize(ingredientElement);

      return {
        ingredient,
        preparation,
      };
    })
  );

  // stringifying to store array of objects in sqliteDB
  const stringifiedIngredients = JSON.stringify(ingredients);

  return stringifiedIngredients;
};

export const addRecipeToDatabase = async (
  db,
  title,
  imageURL,
  stringifiedIngredients
) => {
  await new Promise((resolve, reject) => {
    db.run(
      `
      CREATE TABLE IF NOT EXISTS recipe (
        title TEXT,
        imageURL TEXT,
        ingredients TEXT
      )`,
      (err) => {
        if (err) {
          console.error("Error creating table:", err.message);
          reject(err);
        } else {
          console.log("Table 'recipe' created successfully");
          resolve();
        }
      }
    );
  });

  const stmt = db.prepare(
    "INSERT INTO recipe (title, imageURL, ingredients) VALUES (?, ?, ?)"
  );

  stmt.run(title, imageURL, stringifiedIngredients);

  stmt.finalize();
};
