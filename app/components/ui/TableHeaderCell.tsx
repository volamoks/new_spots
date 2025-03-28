import React from 'react';

interface TableHeaderCellProps {
  children: React.ReactNode;
  className?: string; // Allow overriding/extending classes if needed
}

const TableHeaderCell: React.FC<TableHeaderCellProps> = ({ children, className = '' }) => {
  const baseClasses = "px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider";
  return (
    <th scope="col" className={`${baseClasses} ${className}`}>
      {children}
    </th>
  );
};

export default TableHeaderCell;