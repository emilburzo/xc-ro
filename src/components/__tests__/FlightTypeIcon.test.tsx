import React from "react";
import { render, screen } from "@testing-library/react";
import FlightTypeIcon from "../FlightTypeIcon";

describe("FlightTypeIcon", () => {
  it("is an image named by its label, with the label as tooltip", () => {
    render(<FlightTypeIcon type="fai" label="triunghi FAI" />);
    const icon = screen.getByRole("img", { name: "triunghi FAI" });
    expect(icon).toHaveAttribute("title", "triunghi FAI");
  });

  it("is hidden from assistive technology without a label", () => {
    const { container } = render(<FlightTypeIcon type="free" />);
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
    expect(container.firstChild).toHaveAttribute("aria-hidden", "true");
  });

  it("fills the triangle for FAI and outlines it for flat triangles", () => {
    const fai = render(<FlightTypeIcon type="fai" label="FAI" />).container.querySelector("svg");
    const flat = render(<FlightTypeIcon type="flat" label="flat" />).container.querySelector("svg");
    expect(fai).toHaveAttribute("fill", "currentColor");
    expect(flat).toHaveAttribute("fill", "none");
    expect(fai?.innerHTML).toBe(flat?.innerHTML);
  });

  it("draws free flights as a different shape", () => {
    const free = render(<FlightTypeIcon type="free" />).container.querySelector("path");
    const flat = render(<FlightTypeIcon type="flat" />).container.querySelector("path");
    expect(free?.getAttribute("d")).not.toBe(flat?.getAttribute("d"));
  });

  it("applies the given size classes", () => {
    const { container } = render(<FlightTypeIcon type="flat" className="w-3.5 h-3.5" />);
    expect(container.querySelector("svg")).toHaveClass("w-3.5", "h-3.5");
  });
});
