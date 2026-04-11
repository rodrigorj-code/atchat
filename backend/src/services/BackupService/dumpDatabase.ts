import { spawn } from "child_process";
import fs from "fs";
import path from "path";
import { createWriteStream } from "fs";

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

/**
 * Exporta o schema + dados para ficheiro SQL (mysqldump ou pg_dump).
 * Requer cliente `mysqldump` ou `pg_dump` no PATH do servidor.
 */
export async function dumpDatabaseToFile(outSqlPath: string): Promise<void> {
  const env = getEnv();
  if (!env.database || !env.user) {
    throw new Error("BACKUP_DB_ENV_INCOMPLETE");
  }

  await fs.promises.mkdir(path.dirname(outSqlPath), { recursive: true });

  if (env.dialect === "postgres" || env.dialect === "postgresql") {
    await runPgDump(outSqlPath, env);
    return;
  }

  if (env.dialect === "mysql" || env.dialect === "mariadb") {
    await runMysqlDump(outSqlPath, env);
    return;
  }

  throw new Error(`BACKUP_DB_DIALECT_UNSUPPORTED:${env.dialect}`);
}

async function runMysqlDump(
  outSqlPath: string,
  env: ReturnType<typeof getEnv>
): Promise<void> {
  const args = [
    "-h",
    env.host,
    "-P",
    env.port,
    "-u",
    env.user,
    "--single-transaction",
    "--routines",
    "--triggers",
    "--add-drop-table",
    env.database
  ];

  const writeStream = createWriteStream(outSqlPath, { flags: "w" });
  await new Promise<void>((resolve, reject) => {
    const child = spawn("mysqldump", args, {
      env: { ...process.env, MYSQL_PWD: env.password },
      stdio: ["ignore", "pipe", "pipe"]
    });
    child.stdout.pipe(writeStream);
    let errBuf = "";
    child.stderr?.on("data", (c: Buffer) => {
      errBuf += c.toString();
    });
    child.on("error", (e) => reject(e));
    child.on("close", (code) => {
      writeStream.end();
      if (code === 0) resolve();
      else reject(new Error(`mysqldump exited ${code}: ${errBuf}`));
    });
  });
}

async function runPgDump(
  outSqlPath: string,
  env: ReturnType<typeof getEnv>
): Promise<void> {
  const args = [
    "-h",
    env.host,
    "-p",
    env.port,
    "-U",
    env.user,
    "-d",
    env.database,
    "--no-owner",
    "--clean",
    "--if-exists"
  ];
  const envPg = { ...process.env, PGPASSWORD: env.password };
  const writeStream = createWriteStream(outSqlPath, { flags: "w" });
  await new Promise<void>((resolve, reject) => {
    const child = spawn("pg_dump", args, {
      env: envPg,
      stdio: ["ignore", "pipe", "pipe"]
    });
    child.stdout.pipe(writeStream);
    let errBuf = "";
    child.stderr?.on("data", (c: Buffer) => {
      errBuf += c.toString();
    });
    child.on("error", (e) => reject(e));
    child.on("close", (code) => {
      writeStream.end();
      if (code === 0) resolve();
      else reject(new Error(`pg_dump exited ${code}: ${errBuf}`));
    });
  });
}
