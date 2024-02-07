import sqlite3 from "sqlite3";

const db = new sqlite3.Database("recipe.db");

db.all("SELECT * FROM recipe", (err, rows) => {
  if (err) {
    console.error("Error retrieving data from the database:", err.message);
  } else {
    console.log("Contents of the 'recipe' table:");
    console.table(rows);
  }
});
