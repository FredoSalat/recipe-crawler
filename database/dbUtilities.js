export const addRecipeToDatabase = async (
  db,
  title,
  imageURL,
  ingredients,
  amount,
  cookingTime,
  category,
  cookingInstructions
) => {
  await new Promise((resolve, reject) => {
    db.run(
      `
        CREATE TABLE IF NOT EXISTS recipe (
          title TEXT,
          imageURL TEXT,
          ingredients TEXT,
          amount TEXT,
          cookingTime TEXT,
          category TEXT,
          cookingInstructions TEXT
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
    "INSERT INTO recipe (title, imageURL, ingredients, amount, cookingTime, category, cookingInstructions) VALUES (?, ?, ?, ?, ?, ?, ?)"
  );

  stmt.run(
    title,
    imageURL,
    ingredients,
    amount,
    cookingTime,
    category,
    cookingInstructions
  );

  stmt.finalize();
};
