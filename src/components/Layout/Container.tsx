import React from 'react';
import styles from './Layout.module.scss';

interface ContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  fluid?: boolean;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'xxl';
  className?: string;
}

const Container: React.FC<ContainerProps> = ({
  children,
  fluid = false,
  size = 'xl',
  className = '',
  ...props
}) => {
  const containerClasses = [
    styles.container,
    fluid ? styles.containerFluid : styles[`container-${size}`],
    className
  ].filter(Boolean).join(' ');

  return (
    <div className={containerClasses} {...props}>
      {children}
    </div>
  );
};

export default Container;