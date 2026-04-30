import { render, screen } from "@testing-library/react";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import HomePage from "../app/page";

jest.mock("@/lib/auth", () => ({
  auth: jest.fn(),
  signOut: jest.fn(),
}));

// next/navigation's redirect() throws in the real runtime to stop rendering.
// Mirror that here so component code after the redirect call is never reached.
jest.mock("next/navigation", () => ({
  redirect: jest.fn().mockImplementation(() => {
    throw new Error("NEXT_REDIRECT");
  }),
}));

describe("HomePage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (redirect as unknown as jest.Mock).mockImplementation(() => {
      throw new Error("NEXT_REDIRECT");
    });
  });

  it("renders welcome with user name when authenticated", async () => {
    (auth as jest.Mock).mockResolvedValue({ user: { name: "Alice" } });
    render(await HomePage());
    expect(
      screen.getByRole("heading", { name: "Document Q&A" })
    ).toBeInTheDocument();
    expect(screen.getByText("Alice")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Sign out" })
    ).toBeInTheDocument();
  });

  it("falls back to email when name is absent", async () => {
    (auth as jest.Mock).mockResolvedValue({
      user: { email: "alice@example.com" },
    });
    render(await HomePage());
    expect(screen.getByText("alice@example.com")).toBeInTheDocument();
  });

  it("redirects to /login when unauthenticated", async () => {
    (auth as jest.Mock).mockResolvedValue(null);
    await expect(HomePage()).rejects.toThrow("NEXT_REDIRECT");
    expect(redirect).toHaveBeenCalledWith("/login");
  });
});
