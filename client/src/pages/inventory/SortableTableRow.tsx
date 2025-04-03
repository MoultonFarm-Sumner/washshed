import { ReactNode } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  id: string;
  children: ReactNode;
  onClick?: () => void;
  className?: string;
}

export function SortableTableRow({ id, children, onClick, className }: Props) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    position: "relative" as const,
    zIndex: isDragging ? 1 : 0,
    boxShadow: isDragging ? "0 4px 8px rgba(0, 0, 0, 0.1)" : undefined,
  };

  return (
    <tr
      ref={setNodeRef}
      style={style}
      className={cn(
        "cursor-pointer relative",
        isDragging ? "bg-gray-50" : "",
        className
      )}
      onClick={onClick}
    >
      <td className="absolute left-0 top-0 h-full flex items-center justify-center z-10 pl-1 pr-1 cursor-grab touch-none" 
          {...attributes} 
          {...listeners}>
        <div className="text-gray-400 hover:text-gray-600 rounded-md hover:bg-gray-100 p-1">
          <GripVertical size={18} />
        </div>
      </td>
      {children}
    </tr>
  );
}