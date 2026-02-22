import { healthcheck } from "../health";

jest.mock("../../db", () => ({
  db: {
    execute: jest.fn().mockResolvedValue([{ "?column?": 1 }]),
  },
}));

import { db } from "../../db";

describe("healthcheck", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("executes a SELECT 1 query", async () => {
    await healthcheck();
    expect(db.execute).toHaveBeenCalledTimes(1);
  });

  it("propagates database errors", async () => {
    (db.execute as jest.Mock).mockRejectedValueOnce(new Error("connection refused"));
    await expect(healthcheck()).rejects.toThrow("connection refused");
  });
});
