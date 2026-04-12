import { spawn } from "child_process";
import { createReadStream } from "fs";
import path from "path";
import { pipeline } from "stream/promises";

/** Raiz do backend (onde está .sequelizerc) — dist/services/BackupService → ../../../ */
function getBackendRootForCli(): string {
  return path.resolve(__dirname, "..", "..", "..");
}

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
  let errBuf = "";
  const child = spawn(
    "mysql",
    ["-h", env.host, "-P", env.port, "-u", env.user, env.database],
    {
      env: { ...process.env, MYSQL_PWD: env.password },
      stdio: ["pipe", "pipe", "pipe"]
    }
  );
  child.stderr?.on("data", (c: Buffer) => {
    errBuf += c.toString();
  });
  const exitPromise = new Promise<void>((resolve, reject) => {
    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`mysql import failed (${code}): ${errBuf}`));
    });
  });
  try {
    await pipeline(createReadStream(sqlPath), child.stdin);
  } catch (e) {
    child.kill("SIGKILL");
    throw e;
  }
  await exitPromise;
}

export async function restorePostgresFromSqlFile(sqlPath: string): Promise<void> {
  const env = getEnv();
  let errBuf = "";
  const child = spawn(
    "psql",
    ["-h", env.host, "-p", env.port, "-U", env.user, "-d", env.database, "-v", "ON_ERROR_STOP=1"],
    {
      env: { ...process.env, PGPASSWORD: env.password },
      stdio: ["pipe", "pipe", "pipe"]
    }
  );
  child.stderr?.on("data", (c: Buffer) => {
    errBuf += c.toString();
  });
  const exitPromise = new Promise<void>((resolve, reject) => {
    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`psql import failed (${code}): ${errBuf}`));
    });
  });
  try {
    await pipeline(createReadStream(sqlPath), child.stdin);
  } catch (e) {
    child.kill("SIGKILL");
    throw e;
  }
  await exitPromise;
}

/**
 * Após importar o SQL, aplica migrations pendentes (ex.: tabelas novas vs backup antigo).
 * Deve correr com cwd na raiz do backend para o sequelize-cli ler .sequelizerc.
 */
export async function runSequelizeDbMigrateAfterRestore(): Promise<void> {
  const root = getBackendRootForCli();
  const npxCmd = process.platform === "win32" ? "npx.cmd" : "npx";
  await new Promise<void>((resolve, reject) => {
    const child = spawn(npxCmd, ["sequelize", "db:migrate"], {
      cwd: root,
      env: { ...process.env },
      stdio: ["ignore", "pipe", "pipe"]
    });
    let errBuf = "";
    let outBuf = "";
    child.stdout?.on("data", (c: Buffer) => {
      outBuf += c.toString();
    });
    child.stderr?.on("data", (c: Buffer) => {
      errBuf += c.toString();
    });
    child.on("error", reject);
    child.on("close", (code) => {
      const log = `${outBuf}${errBuf}`.trim();
      if (log) {
        console.log("[restore] sequelize db:migrate:\n", log.slice(0, 4000));
      }
      if (code === 0) resolve();
      else {
        reject(
          new Error(
            `RESTORE_MIGRATE_FAILED: sequelize db:migrate saiu com código ${code}. ${errBuf}\n${outBuf}`
          )
        );
      }
    });
  });
}

async function execPsqlScalar(
  env: ReturnType<typeof getEnv>,
  sql: string
): Promise<string> {
  return new Promise((resolve, reject) => {
    const child = spawn(
      "psql",
      ["-h", env.host, "-p", env.port, "-U", env.user, "-d", env.database, "-t", "-A", "-c", sql],
      {
        env: { ...process.env, PGPASSWORD: env.password },
        stdio: ["ignore", "pipe", "pipe"]
      }
    );
    let out = "";
    let errBuf = "";
    child.stdout?.on("data", (c: Buffer) => {
      out += c.toString();
    });
    child.stderr?.on("data", (c: Buffer) => {
      errBuf += c.toString();
    });
    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) resolve(out);
      else reject(new Error(`psql (verificação): ${errBuf}`));
    });
  });
}

async function execMysqlScalar(
  env: ReturnType<typeof getEnv>,
  sql: string
): Promise<string> {
  return new Promise((resolve, reject) => {
    const child = spawn(
      "mysql",
      ["-h", env.host, "-P", env.port, "-u", env.user, "-N", "-B", "-e", sql, env.database],
      {
        env: { ...process.env, MYSQL_PWD: env.password },
        stdio: ["ignore", "pipe", "pipe"]
      }
    );
    let out = "";
    let errBuf = "";
    child.stdout?.on("data", (c: Buffer) => {
      out += c.toString();
    });
    child.stderr?.on("data", (c: Buffer) => {
      errBuf += c.toString();
    });
    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) resolve(out);
      else reject(new Error(`mysql (verificação): ${errBuf}`));
    });
  });
}

/**
 * Garante que o schema mínimo existe (evita API 500 após restauro).
 */
export async function verifyRestoredSchemaCoreTables(): Promise<void> {
  const env = getEnv();
  const d = env.dialect;
  if (d === "postgres" || d === "postgresql") {
    const sql = `SELECT (
  CASE WHEN to_regclass('public."Users"') IS NOT NULL THEN 1 ELSE 0 END +
  CASE WHEN to_regclass('public."Companies"') IS NOT NULL THEN 1 ELSE 0 END +
  CASE WHEN to_regclass('public."SystemSettings"') IS NOT NULL THEN 1 ELSE 0 END
)::text;`;
    const out = await execPsqlScalar(env, sql);
    const n = parseInt(out.trim(), 10);
    if (Number.isNaN(n) || n !== 3) {
      throw new Error(
        `RESTORE_SCHEMA_INCOMPLETE: faltam tabelas core (Users/Companies/SystemSettings). Encontradas ${Number.isNaN(n) ? "?" : n}/3. Restaure o ZIP de pré-restauração (pasta backups) ou use uma base limpa com db:migrate.`
      );
    }
    return;
  }
  if (d === "mysql" || d === "mariadb") {
    const sql =
      "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name IN ('Users','Companies','SystemSettings');";
    const out = await execMysqlScalar(env, sql);
    const n = parseInt(out.trim(), 10);
    if (Number.isNaN(n) || n !== 3) {
      throw new Error(
        `RESTORE_SCHEMA_INCOMPLETE: faltam tabelas core (Users/Companies/SystemSettings). Encontradas ${Number.isNaN(n) ? "?" : n}/3.`
      );
    }
  }
}
