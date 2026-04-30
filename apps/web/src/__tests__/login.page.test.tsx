import { render, screen } from "@testing-library/react";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import LoginPage from "../app/login/page";

jest.mock("@/lib/auth", () => ({
  auth: jest.fn(),
  signIn: jest.fn(),
}));

jest.mock("next/navigation", () => ({
  redirect: jest.fn().mockImplementation(() => {
    throw new Error("NEXT_REDIRECT");
  }),
}));

describe("LoginPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (redirect as unknown as jest.Mock).mockImplementation(() => {
      throw new Error("NEXT_REDIRECT");
    });
  });

  it("renders heading and sign-in button when unauthenticated", async () => {
    (auth as jest.Mock).mockResolvedValue(null);
    render(await LoginPage());
    expect(
      screen.getByRole("heading", { name: "Document Q&A" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /sign in with google/i })
    ).toBeInTheDocument();
  });

  it("redirects to / when already authenticated", async () => {
    (auth as jest.Mock).mockResolvedValue({ user: { name: "Alice" } });
    await expect(LoginPage()).rejects.toThrow("NEXT_REDIRECT");
    expect(redirect).toHaveBeenCalledWith("/");
  });
});
