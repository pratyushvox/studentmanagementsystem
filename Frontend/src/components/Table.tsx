
import type { ReactNode } from "react";
import { Edit2, Trash2, Eye } from "lucide-react";

export interface Column {
  header: string;
  accessor: string;
  cell?: (row: any) => ReactNode;
  className?: string;
}

export interface Action {
  icon: "edit" | "delete" | "view" | ReactNode;
  label: string;
  onClick: (row: any) => void;
  className?: string;
  show?: (row: any) => boolean;
}

interface DataTableProps {
  columns: Column[];
  data: any[];
  actions?: Action[];
  emptyMessage?: string;
  isLoading?: boolean;
  onRowClick?: (row: any) => void;
  rowClassName?: (row: any) => string;
}

const DataTable = ({
  columns,
  data,
  actions = [],
  emptyMessage = "No data found",
  isLoading = false,
  onRowClick,
  rowClassName
}: DataTableProps) => {
  const getActionIcon = (icon: "edit" | "delete" | "view" | ReactNode) => {
    if (typeof icon !== "string") return icon;
    
    switch (icon) {
      case "edit":
        return <Edit2 className="w-4 h-4" />;
      case "delete":
        return <Trash2 className="w-4 h-4" />;
      case "view":
        return <Eye className="w-4 h-4" />;
      default:
        return null;
    }
  };

  const getActionButtonClass = (icon: string) => {
    switch (icon) {
      case "edit":
        return "p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors";
      case "delete":
        return "p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors";
      case "view":
        return "p-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors";
      default:
        return "p-2 hover:bg-gray-50 rounded-lg transition-colors";
    }
  };

  const getCellValue = (row: any, column: Column) => {
    if (column.cell) {
      return column.cell(row);
    }
    
    // Handle nested accessors like "user.name"
    const keys = column.accessor.split('.');
    let value = row;
    for (const key of keys) {
      value = value?.[key];
      if (value === undefined || value === null) break;
    }
    
    return value ?? "-";
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-12 text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              {columns.map((column, index) => (
                <th
                  key={index}
                  className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${
                    column.className || ""
                  }`}
                >
                  {column.header}
                </th>
              ))}
              {actions.length > 0 && (
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              )}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {data.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length + (actions.length > 0 ? 1 : 0)}
                  className="px-6 py-12 text-center text-gray-500"
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              data.map((row, rowIndex) => (
                <tr
                  key={rowIndex}
                  onClick={() => onRowClick?.(row)}
                  className={`hover:bg-gray-50 transition-colors ${
                    onRowClick ? "cursor-pointer" : ""
                  } ${rowClassName ? rowClassName(row) : ""}`}
                >
                  {columns.map((column, colIndex) => (
                    <td
                      key={colIndex}
                      className={`px-6 py-4 ${column.className || ""}`}
                    >
                      {getCellValue(row, column)}
                    </td>
                  ))}
                  {actions.length > 0 && (
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2">
                        {actions.map((action, actionIndex) => {
                          const shouldShow = action.show ? action.show(row) : true;
                          if (!shouldShow) return null;

                          return (
                            <button
                              key={actionIndex}
                              onClick={(e) => {
                                e.stopPropagation();
                                action.onClick(row);
                              }}
                              className={
                                action.className ||
                                getActionButtonClass(action.icon as string)
                              }
                              title={action.label}
                            >
                              {getActionIcon(action.icon)}
                            </button>
                          );
                        })}
                      </div>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DataTable;