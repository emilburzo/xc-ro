interface SortHeaderProps {
  col: string;
  label: string;
  align?: "right";
  activeSort?: string;
  activeDir?: string;
  onSort: (col: string) => void;
}

export default function SortHeader({ col, label, align, activeSort, activeDir, onSort }: SortHeaderProps) {
  return (
    <th
      className={`px-2 py-2 ${align === "right" ? "text-right" : "text-left"} text-xs font-medium text-gray-500 cursor-pointer hover:text-gray-900 whitespace-nowrap sticky top-0 bg-white z-10 border-b border-gray-200`}
      onClick={() => onSort(col)}
    >
      {label} {activeSort === col ? (activeDir === "asc" ? "↑" : "↓") : ""}
    </th>
  );
}
