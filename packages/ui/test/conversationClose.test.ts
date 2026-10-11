import assert from "node:assert/strict";
import test from "node:test";
import { useZCodeSessionStore } from "../src/store/zcodeSessionStore.js";

const WORKSPACE = "/tmp/hcode-close-conversation-test";

function workspaceState() {
  return useZCodeSessionStore.getState().getWorkspaceState(WORKSPACE);
}

test("closeActiveConversation clears the open task without opening a draft", () => {
  const store = useZCodeSessionStore.getState();
  store.setActiveTaskId(WORKSPACE, "task-close-1");
  assert.equal(workspaceState().activeTaskId, "task-close-1");

  store.closeActiveConversation(WORKSPACE);

  const state = workspaceState();
  assert.equal(state.activeTaskId, null);
  assert.equal(state.conversationClosed, true);
});

test("selecting a task after closing restores the chat view", () => {
  const store = useZCodeSessionStore.getState();
  store.setActiveTaskId(WORKSPACE, "task-close-2");
  store.closeActiveConversation(WORKSPACE);

  store.setActiveTaskId(WORKSPACE, "task-close-3");

  const state = workspaceState();
  assert.equal(state.activeTaskId, "task-close-3");
  assert.equal(state.conversationClosed, false);
});

test("starting a new draft after closing restores the draft view", () => {
  const store = useZCodeSessionStore.getState();
  store.setActiveTaskId(WORKSPACE, "task-close-4");
  store.closeActiveConversation(WORKSPACE);

  store.startDraft(WORKSPACE);

  const state = workspaceState();
  assert.equal(state.activeTaskId, null);
  assert.equal(state.conversationClosed, false);
});
