import assert from "node:assert/strict";
import { test } from "vitest";
import {
  shouldEnableProviderAvailabilityLoginEntryGuard,
  shouldResolveProviderStartupState,
  shouldShowRootStartupLoading,
} from "../src/lib/rootStartupGate.js";

test("desktop startup does not open the Z.AI login entry by default", () => {
  assert.equal(shouldEnableProviderAvailabilityLoginEntryGuard(), false);
});

test("disabled startup login guard does not keep the startup gate waiting", () => {
  // 守卫关闭时 startupCheckCompleted 初始即为 true，启动门禁只等待 Provider 设置同步完成。
  assert.equal(
    shouldResolveProviderStartupState({
      providerStartupSyncPending: false,
      providerAvailabilityStartupCheckCompleted: true,
    }),
    false,
  );
  assert.equal(
    shouldShowRootStartupLoading({
      isDesktop: true,
      isResolvingStartupAuthState: false,
      isResolvingProviderStartupState: false,
      isRestoring: false,
      isBootstrappingInitialWorkspace: false,
    }),
    false,
  );
});
