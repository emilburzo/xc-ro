import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import SortHeader from "../SortHeader";

function renderHeader(props: Partial<React.ComponentProps<typeof SortHeader>> = {}) {
  const onSort = jest.fn();
  render(
    <table>
      <thead>
        <tr>
          <SortHeader col="distance" label="Distance" onSort={onSort} {...props} />
        </tr>
      </thead>
    </table>,
  );
  return { header: screen.getByRole("columnheader"), onSort };
}

describe("SortHeader", () => {
  it("calls onSort with its column when clicked", async () => {
    const { header, onSort } = renderHeader();
    await userEvent.setup().click(header);
    expect(onSort).toHaveBeenCalledWith("distance");
  });

  it("marks the active column with the sort direction", () => {
    expect(renderHeader({ activeSort: "distance", activeDir: "desc" }).header).toHaveTextContent("Distance ↓");
  });

  it("shows an up arrow when sorted ascending", () => {
    expect(renderHeader({ activeSort: "distance", activeDir: "asc" }).header).toHaveTextContent("Distance ↑");
  });

  it("shows no arrow on inactive columns", () => {
    expect(renderHeader({ activeSort: "score", activeDir: "desc" }).header).toHaveTextContent(/^Distance$/);
  });

  it.each([
    [undefined, "text-left"],
    ["right", "text-right"],
    ["center", "text-center"],
  ] as const)("aligns %s as %s", (align, cls) => {
    expect(renderHeader({ align }).header).toHaveClass(cls);
  });
});
