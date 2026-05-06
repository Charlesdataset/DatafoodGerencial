import React from 'react';
import styles from './Card.module.scss';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  variant?: 'default' | 'outline' | 'filled';
  shadow?: 'none' | 'sm' | 'md' | 'lg';
  className?: string;
}

const Card: React.FC<CardProps> & {
  Header: typeof CardHeader;
  Body: typeof CardBody;
  Footer: typeof CardFooter;
  Title: typeof CardTitle;
  Text: typeof CardText;
  Image: typeof CardImage;
} = ({
  children,
  variant = 'default',
  shadow = 'md',
  className = '',
  ...props
}) => {
  const cardClasses = [
    styles.card,
    styles[`card--${variant}`],
    styles[`card--shadow-${shadow}`],
    className
  ].filter(Boolean).join(' ');

  return (
    <div className={cardClasses} {...props}>
      {children}
    </div>
  );
};

// Card Header Component
interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
}

const CardHeader: React.FC<CardHeaderProps> = ({ children, className = '', ...props }) => {
  const headerClasses = [styles.cardHeader, className].filter(Boolean).join(' ');

  return (
    <div className={headerClasses} {...props}>
      {children}
    </div>
  );
};

// Card Body Component
interface CardBodyProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

const CardBody: React.FC<CardBodyProps> = ({
  children,
  className = '',
  padding = 'md',
  ...props
}) => {
  const bodyClasses = [
    styles.cardBody,
    styles[`cardBody--padding-${padding}`],
    className
  ].filter(Boolean).join(' ');

  return (
    <div className={bodyClasses} {...props}>
      {children}
    </div>
  );
};

// Card Footer Component
interface CardFooterProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
}

const CardFooter: React.FC<CardFooterProps> = ({ children, className = '', ...props }) => {
  const footerClasses = [styles.cardFooter, className].filter(Boolean).join(' ');

  return (
    <div className={footerClasses} {...props}>
      {children}
    </div>
  );
};

// Card Title Component
interface CardTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {
  children: React.ReactNode;
  className?: string;
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
}

const CardTitle: React.FC<CardTitleProps> = ({
  children,
  className = '',
  as: Component = 'h3',
  ...props
}) => {
  const titleClasses = [styles.cardTitle, className].filter(Boolean).join(' ');

  return (
    <Component className={titleClasses} {...props}>
      {children}
    </Component>
  );
};

// Card Text Component
interface CardTextProps extends React.HTMLAttributes<HTMLParagraphElement> {
  children: React.ReactNode;
  className?: string;
}

const CardText: React.FC<CardTextProps> = ({ children, className = '', ...props }) => {
  const textClasses = [styles.cardText, className].filter(Boolean).join(' ');

  return (
    <p className={textClasses} {...props}>
      {children}
    </p>
  );
};

// Card Image Component
interface CardImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  className?: string;
  position?: 'top' | 'bottom';
}

const CardImage: React.FC<CardImageProps> = ({
  src,
  alt,
  className = '',
  position = 'top',
  ...props
}) => {
  const imageClasses = [
    styles.cardImage,
    styles[`cardImage--${position}`],
    className
  ].filter(Boolean).join(' ');

  return (
    <img src={src} alt={alt} className={imageClasses} {...props} />
  );
};

// Attach subcomponents to main Card component
Card.Header = CardHeader;
Card.Body = CardBody;
Card.Footer = CardFooter;
Card.Title = CardTitle;
Card.Text = CardText;
Card.Image = CardImage;

export default Card;