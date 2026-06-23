import mysql from 'mysql2/promise'

function normalizeMysqlHost(raw) {
  const h = (raw ?? '127.0.0.1').trim()
  // Common typo: DNS cannot resolve "localost"
  if (h === 'localost') return '127.0.0.1'
  return h
}

export function createPoolFromEnv() {
  return mysql.createPool({
    host: normalizeMysqlHost(process.env.MYSQL_HOST),
    port: Number(process.env.MYSQL_PORT) || 3306,
    user: process.env.MYSQL_USER ?? 'root',
    password: process.env.MYSQL_PASSWORD ?? '',
    database: process.env.MYSQL_DATABASE ?? 'tourism_admin',
    waitForConnections: true,
    connectionLimit: 20,
    maxIdle: 10,
    idleTimeout: 60_000,
    enableKeepAlive: true,
  })
}
