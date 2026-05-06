// components/DataGrid/ImageCell.tsx
import { faImage, faSpinner } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { memo, useEffect, useRef, useState } from "react";
import styles from "./ImageCell.module.scss";

interface ImageCellProps {
  src: string;
  alt?: string;
  fallbackSrc?: string;
  width?: number | string;
  height?: number | string;
  rounded?: boolean;
  showBadge?: boolean;
  badgeText?: string;
  badgeColor?: string;
  className?: string;
  onClick?: () => void;
}

export const ImageCell = memo(function ImageCell({
  src,
  alt = "Imagem",
  fallbackSrc = "/placeholder-image.png",
  width = 40,
  height = 40,
  rounded = true,
  showBadge = false,
  badgeText,
  badgeColor = "#42ab8a",
  className = "",
  onClick,
}: ImageCellProps) {
  const [imgSrc, setImgSrc] = useState(src);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const imgRef = useRef<HTMLImageElement | null>(null);

  // Sincroniza quando o src muda (ex: troca de página, re-render do pai)
  useEffect(() => {
    setImgSrc(src);
    setLoading(true);
    setError(false);
  }, [src]);

  useEffect(() => {
    const img = imgRef.current;
    if (!img) return;
    if (img.complete && img.naturalWidth > 0) {
      setLoading(false);
    }
  }, [imgSrc]);

  const handleLoad = () => {
    setLoading(false);
  };

  const handleError = () => {
    setLoading(false);
    if (!error) {
      setImgSrc(fallbackSrc);
      setError(true);
    }
  };

  // Se não tem src ou deu erro, mostra ícone
  if (!src || error) {
    return (
      <div className={`${styles.imageContainer} ${rounded ? styles.rounded : ""} ${styles.placeholder} ${className}`} style={{ width, height }} onClick={onClick}>
        <FontAwesomeIcon icon={faImage} className={styles.placeholderIcon} />
      </div>
    );
  }

  return (
    <div className={`${styles.imageContainer} ${rounded ? styles.rounded : ""} ${className}`} style={{ width, height }} onClick={onClick}>
      {loading && (
        <div className={styles.loadingOverlay}>
          <FontAwesomeIcon icon={faSpinner} spin />
        </div>
      )}

      <img ref={imgRef} src={imgSrc} alt={alt} className={`${styles.image} ${loading ? styles.hidden : ""}`} onLoad={handleLoad} onError={handleError} loading="lazy" />

      {showBadge && !loading && !error && (
        <div className={styles.badge} style={{ backgroundColor: badgeColor }}>
          {badgeText || "✓"}
        </div>
      )}
    </div>
  );
});
