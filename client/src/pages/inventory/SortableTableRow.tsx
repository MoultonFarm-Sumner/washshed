import { ReactNode } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";

interface Props {
  id: string;
  children: ReactNode;
  onClick?: () => void;
}

export function SortableTableRow({ id, children, onClick }: Props) {
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
  };

  return (
    <tr
      ref={setNodeRef}
      style={style}
      className="hover:bg-gray-100 cursor-pointer relative"
      onClick={onClick}
    >
      <td className="absolute left-0 h-full flex items-center justify-center z-10 pl-2 cursor-grab touch-none" 
          {...attributes} 
          {...listeners}>
        <div className="text-gray-400 hover:text-gray-600">
          <GripVertical size={16} />
        </div>
      </td>
      {children}
    </tr>
  );
}