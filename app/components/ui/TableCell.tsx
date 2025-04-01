import React from 'react';

interface TableCellProps {
    children: React.ReactNode;
    className?: string; // Allow overriding/extending classes
}

const TableCell: React.FC<TableCellProps> = ({ children, className = '' }) => {
    // Define the most common classes here
    const baseClasses = 'px-3 py-4 whitespace-nowrap text-sm text-gray-500';
    return <td className={`${baseClasses} ${className}`}>{children}</td>;
};

export default TableCell;
