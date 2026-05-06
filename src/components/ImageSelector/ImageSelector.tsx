// src/pages/Events/components/EventImageUpload/EventImageUpload.tsx

import { faCamera, faTimes, faUpload } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useRef, useState } from "react";
import { useResponsive } from "../../hooks/useResponsive";
import { Button } from "../Button";
import Card from "../Card/Card";
import styles from "./ImageSelector.module.scss";

// ============================================
// INTERFACES
// ============================================

interface ImageSelectorProps {
  currentFile: string | null;
  onFileChange: (file: File | null, previewUrl: string | null) => void;
  title?: string;
  subtitle?: string;
  preview?: any;
  classnames?: string;
  bodyClassnames?: string;
  bodyStyle?: React.CSSProperties;
}

// ============================================
// COMPONENTE PRINCIPAL
// ============================================
const ImageSelector = ({ preview, currentFile, onFileChange, title = "", subtitle = "", classnames = "", bodyClassnames = "", bodyStyle = {} }: ImageSelectorProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentFile);
  const { up } = useResponsive();
  // Atualizar preview quando currentFile mudar
  useState(() => {
    setPreviewUrl(currentFile);
  });

  const handleFileSelect = (file: File) => {
    if (!file.type.startsWith("image/")) {
      alert("Por favor, selecione apenas arquivos de imagem.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert("A imagem deve ter no máximo 5MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setPreviewUrl(result);
      onFileChange(file, result);
    };
    reader.readAsDataURL(file);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleRemoveImage = () => {
    setPreviewUrl(null);
    onFileChange(null, null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleClickUpload = () => {
    fileInputRef.current?.click();
  };

  return (
    <Card className={classnames}>
      <Card.Body style={bodyStyle} className={`position-relative d-flex flex-column  ${bodyClassnames}`}>
        {(title || subtitle) && (
          <div className={styles.header}>
            <h3 className={styles.title}>{title}</h3>
            <p className={styles.subtitle}>{subtitle}</p>
          </div>
        )}

        <div
          className={`${styles.uploadArea} ${isDragging ? styles.dragging : ""} ${previewUrl ? styles.hasImage : ""}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={previewUrl ? undefined : handleClickUpload}
        >
          <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileInputChange} className={styles.fileInput} />

          {previewUrl || preview ? (
            <>
              <div className={styles.imagePreview}>
                <img src={preview != "" ? preview : previewUrl} alt="Preview" className={styles.previewImage} />
                <div className={styles.imageOverlay}>
                  <button className={styles.changeButton} onClick={handleClickUpload} type="button">
                    <FontAwesomeIcon icon={faCamera} className={styles.buttonIcon} />
                    Alterar
                  </button>
                  <button className={styles.removeButton} onClick={handleRemoveImage} type="button">
                    <FontAwesomeIcon icon={faTimes} className={styles.buttonIcon} />
                    Remover
                  </button>
                </div>
              </div>
            </>
          ) : (
            <>
              {up("md") ? (
                <>
                  <div className={styles.uploadIcon}>
                    <FontAwesomeIcon icon={faUpload} />
                  </div>
                  <div className={styles.uploadText}>
                    <p className={styles.primaryText}>Arraste e solte uma imagem aqui</p>
                    <p className={styles.secondaryText}>ou</p>
                    <Button size="sm" variant="primary" type="button">
                      Selecione
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <div className={styles.uploadIcon}>
                    <FontAwesomeIcon icon={faCamera} style={{ fontSize: 50 }} />
                  </div>
                </>
              )}
            </>
          )}
        </div>

        {previewUrl && (
          <div className={styles.actions}>
            <button className={styles.actionButton} onClick={handleClickUpload} type="button">
              <FontAwesomeIcon icon={faCamera} className={styles.actionIcon} />
              Alterar Imagem
            </button>
            <button className={`${styles.actionButton} ${styles.removeAction}`} onClick={handleRemoveImage} type="button">
              <FontAwesomeIcon icon={faTimes} className={styles.actionIcon} />
              Remover Imagem
            </button>
          </div>
        )}
      </Card.Body>
    </Card>
  );
};
export default ImageSelector;
