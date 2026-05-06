import React from 'react';
import styles from './Layout.module.scss';

interface RowProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  gutter?: 'none' | 'sm' | 'md' | 'lg';
  align?: 'start' | 'center' | 'end' | 'stretch';
  justify?: 'start' | 'center' | 'end' | 'between' | 'around';
  className?: string;
}

const Row: React.FC<RowProps> = ({
  children,
  gutter = 'md',
  align = 'stretch',
  justify = 'start',
  className = '',
  ...props
}) => {
  const rowClasses = [
    styles.row,
    styles[`row-gutter-${gutter}`],
    styles[`row-align-${align}`],
    styles[`row-justify-${justify}`],
    className
  ].filter(Boolean).join(' ');

  return (
    <div className={rowClasses} {...props}>
      {children}
    </div>
  );
};

export default Row;