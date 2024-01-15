export const addRecipeToDatabase = async (db, title, imageURL, ingredients) => {
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

  stmt.run(title, imageURL, ingredients);

  stmt.finalize();
};
