import Database from 'better-sqlite3';
try {
  const db = new Database('prisma/dev.db');
  const users = db.prepare('SELECT * FROM User').all();
  console.log("Users:", users.length);
} catch (e) {
  console.error(e);
}
