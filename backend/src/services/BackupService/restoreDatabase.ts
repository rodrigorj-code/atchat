import { spawn } from "child_process";
import fs from "fs";

function getEnv(): {
  dialect: string;
  host: string;
  port: string;
  database: string;
  user: string;
  password: string;
} {
  return {
    dialect: (process.env.DB_DIALECT || "mysql").toLowerCase(),
    host: process.env.DB_HOST || "127.0.0.1",
    port: String(process.env.DB_PORT || "3306"),
    database: process.env.DB_NAME || "",
    user: process.env.DB_USER || "",
    password: process.env.DB_PASS || ""
  };
}

export async function restoreMysqlFromSqlFile(sqlPath: string): Promise<void> {
  const env = getEnv();
  const sqlBuf = await fs.promises.readFile(sqlPath);
  await new Promise<void>((resolve, reject) => {
    const child = spawn(
      "mysql",
      ["-h", env.host, "-P", env.port, "-u", env.user, env.database],
      {
        env: { ...process.env, MYSQL_PWD: env.password },
        stdio: ["pipe", "pipe", "pipe"]
      }
    );
    child.stdin.write(sqlBuf);
    child.stdin.end();
    let errBuf = "";
    child.stderr?.on("data", (c: Buffer) => {
      errBuf += c.toString();
    });
    child.on("error", (e) => reject(e));
    child.on("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`mysql import failed (${code}): ${errBuf}`));
    });
  });
}

export async function restorePostgresFromSqlFile(sqlPath: string): Promise<void> {
  const env = getEnv();
  const sqlBuf = await fs.promises.readFile(sqlPath);
  await new Promise<void>((resolve, reject) => {
    const child = spawn(
      "psql",
      ["-h", env.host, "-p", env.port, "-U", env.user, "-d", env.database, "-v", "ON_ERROR_STOP=1"],
      {
        env: { ...process.env, PGPASSWORD: env.password },
        stdio: ["pipe", "pipe", "pipe"]
      }
    );
    child.stdin.write(sqlBuf);
    child.stdin.end();
    let errBuf = "";
    child.stderr?.on("data", (c: Buffer) => {
      errBuf += c.toString();
    });
    child.on("error", (e) => reject(e));
    child.on("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`psql import failed (${code}): ${errBuf}`));
    });
  });
}
