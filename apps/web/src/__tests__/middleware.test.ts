jest.mock("@/lib/auth", () => ({
  auth: jest.fn(),
}));

import { config } from "../middleware";

// Next.js anchors matchers to the full path; replicate that here.
const pattern = new RegExp("^" + config.matcher[0] + "$");

describe("middleware matcher", () => {
  it.each([
    ["/login"],
    ["/api/auth/callback/cognito"],
    ["/_next/static/chunk.js"],
    ["/_next/image?url=foo"],
    ["/favicon.ico"],
  ])("allows %s through without auth", (path) => {
    expect(pattern.test(path)).toBe(false);
  });

  it.each([["/"], ["/dashboard"], ["/query"]])(
    "protects %s with auth",
    (path) => {
      expect(pattern.test(path)).toBe(true);
    }
  );
});
