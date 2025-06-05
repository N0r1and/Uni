import { render, screen, fireEvent } from "@testing-library/react";
import Chat from "./Chat";
import { MemoryRouter } from "react-router-dom";

test("рендер чату та привітання", async () => {
  global.fetch = jest.fn((url) => {
    if (url.includes("/api/user-info/")) {
      return Promise.resolve({
        json: () => Promise.resolve({ username: "Test", email: "test@mail.com" }),
      });
    }
    if (url.includes("/api/history/")) {
      return Promise.resolve({
        json: () => Promise.resolve({ history: [] }),
      });
    }
    return Promise.resolve({
      json: () => Promise.resolve({ bot_response: "Тестова відповідь" }),
    });
  });

  render(
    <MemoryRouter>
      <Chat />
    </MemoryRouter>
  );

  expect(await screen.findByText(/бот, який допоможе/)).toBeInTheDocument();
});