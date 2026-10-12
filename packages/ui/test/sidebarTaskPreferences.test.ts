import assert from "node:assert/strict";
import { test } from "vitest";
import {
  persistSidebarTaskPreferences,
  readSidebarTaskPreferences,
} from "../src/lib/sidebarTaskPreferences.js";

const STORAGE_KEY = "zcode-sidebar-task-preferences";

function createStorage(initial?: string) {
  const data = new Map<string, string>();
  if (initial !== undefined) {
    data.set(STORAGE_KEY, initial);
  }
  return {
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => {
      data.set(key, value);
    },
    data,
  };
}

test("默认视图为按项目，排序为按更新时间", () => {
  assert.deepEqual(readSidebarTaskPreferences(createStorage()), {
    organizeBy: "project",
    sortBy: "updated",
  });
});

test("历史偏好 chronological（时间线）回落为按项目，排序仍保留", () => {
  const storage = createStorage(JSON.stringify({ organizeBy: "chronological", sortBy: "created" }));
  assert.deepEqual(readSidebarTaskPreferences(storage), {
    organizeBy: "project",
    sortBy: "created",
  });
});

test("历史偏好 grouped（分组）同样回落为按项目", () => {
  assert.equal(
    readSidebarTaskPreferences(createStorage(JSON.stringify({ organizeBy: "grouped" }))).organizeBy,
    "project",
  );
  assert.equal(
    readSidebarTaskPreferences(createStorage(JSON.stringify({ organizeBy: "project" }))).organizeBy,
    "project",
  );
});

test("持久化后只写入 project", () => {
  const storage = createStorage();
  persistSidebarTaskPreferences({ organizeBy: "project", sortBy: "updated" }, storage);
  assert.equal(
    storage.data.get(STORAGE_KEY),
    JSON.stringify({ organizeBy: "project", sortBy: "updated" }),
  );
});
