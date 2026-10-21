import { DatabaseSync } from "node:sqlite";
import { createHash } from "node:crypto";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  areTasksDatabaseMigrationsApplied,
  inspectTasksMigrationKind,
  runTasksDatabaseMigrations,
} from "../src/session/tasksDatabase/migrations.js";
import { OFFICIAL_GLM_SELECTION_MIGRATION_SQL } from "../src/session/tasksDatabase/official-glm-selection-v3.js";

const sha256 = (input: unknown) => createHash("sha256").update(JSON.stringify(input)).digest("hex");
// ZCode（上游）写入 0003 的 checksum，与 HCode 共用 ~/.zcode/v2/tasks 数据库。
const UPSTREAM_0003_CHECKSUM = sha256([OFFICIAL_GLM_SELECTION_MIGRATION_SQL]);
// 旧版 HCode 写入 0003 的 checksum。
const LEGACY_HCODE_0003_CHECKSUM = sha256(["official-glm-selection-v3"]);

describe("tasks database 0003 checksum compatibility", () => {
  const databases: DatabaseSync[] = [];
  let backupRoot: string;
  const open = () => {
    const db = new DatabaseSync(":memory:");
    databases.push(db);
    return db;
  };
  const migrate = (db: DatabaseSync) =>
    runTasksDatabaseMigrations(db, join(backupRoot, "tasks.sqlite"));
  const set0003Checksum = (db: DatabaseSync, checksum: string) =>
    db
      .prepare(
        "UPDATE tasks_schema_migration SET checksum=? WHERE id='0003_official_glm_selection'",
      )
      .run(checksum);

  beforeEach(async () => {
    backupRoot = await mkdtemp(join(tmpdir(), "hcode-tasks-checksum-"));
  });
  afterEach(async () => {
    for (const db of databases.splice(0)) db.close();
    await rm(backupRoot, { recursive: true, force: true });
  });

  it("records the upstream checksum for 0003 on a fresh database", async () => {
    const db = open();
    await migrate(db);
    expect(
      db
        .prepare(
          "SELECT checksum FROM tasks_schema_migration WHERE id='0003_official_glm_selection'",
        )
        .get(),
    ).toEqual({ checksum: UPSTREAM_0003_CHECKSUM });
  });

  it.each([
    ["ZCode upstream", UPSTREAM_0003_CHECKSUM],
    ["legacy HCode", LEGACY_HCODE_0003_CHECKSUM],
  ])("opens a database whose 0003 ledger row was written by %s", async (_label, checksum) => {
    const db = open();
    await migrate(db);
    set0003Checksum(db, checksum);
    expect(areTasksDatabaseMigrationsApplied(db)).toBe(true);
    expect(inspectTasksMigrationKind(db)).toBe("none");
    await expect(migrate(db)).resolves.toMatchObject({ applied: [] });
  });

  it("applies the remaining migrations after a legacy 0003 row without re-running it", async () => {
    const db = open();
    await migrate(db);
    set0003Checksum(db, LEGACY_HCODE_0003_CHECKSUM);
    db.exec("DELETE FROM tasks_schema_migration WHERE id='0006_task_group_admissions'");
    await expect(migrate(db)).resolves.toMatchObject({ applied: ["0006_task_group_admissions"] });
  });

  it("still rejects an unknown 0003 checksum", async () => {
    const db = open();
    await migrate(db);
    set0003Checksum(db, "tampered");
    expect(() => areTasksDatabaseMigrationsApplied(db)).toThrow(/checksum mismatch/);
  });
});
