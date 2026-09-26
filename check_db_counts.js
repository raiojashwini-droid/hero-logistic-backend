const mariadb = require('mariadb');

async function main() {
  const conn = await mariadb.createConnection({
    host: '127.0.0.1',
    port: 3306,
    user: 'root',
    password: '',
    database: 'hero-logihero'
  });
  const tables = await conn.query('SHOW TABLES;');
  const res = {};
  for (let t of tables) {
    const tbl = Object.values(t)[0];
    try {
      const count = await conn.query('SELECT COUNT(*) as c FROM `' + tbl + '`');
      if (Number(count[0].c) > 0) {
        res[tbl] = Number(count[0].c);
      }
    } catch (err) {
      console.error('Error on ' + tbl + ':', err.message);
    }
  }
  console.log('Non-empty tables in DB:\n', JSON.stringify(res, null, 2));
  await conn.end();
}

main().catch(console.error);
