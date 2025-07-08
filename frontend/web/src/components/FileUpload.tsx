import React, { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import './FileUpload.css';

interface FileUploadProps {
  onImageAnalyzed: (ingredients: any[]) => void;
  token: string;
}

export const FileUpload: React.FC<FileUploadProps> = ({ onImageAnalyzed, token }) => {
  const { t } = useTranslation();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);

  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';

  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  }, []);

  const handleDrop = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      setSelectedFile(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  }, []);

  const handleDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  }, []);

  const analyzeImage = async () => {
    if (!selectedFile) return;

    setIsAnalyzing(true);
    
    try {
      const formData = new FormData();
      formData.append('image', selectedFile);

      const response = await fetch(`${API_URL}/api/analysis/image`, {
        method: 'POST',
        body: formData,
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Analysis failed');
      }

      onImageAnalyzed(data.data.ingredients);
    } catch (error) {
      console.error('Analysis error:', error);
      alert(t('camera.scanFailed'));
    } finally {
      setIsAnalyzing(false);
    }
  };

  const clearFile = () => {
    setSelectedFile(null);
    setPreview(null);
  };

  return (
    <div className=\"file-upload-container\">
      <h2>{t('camera.title')}</h2>
      
      {!preview ? (
        <div
          className=\"drop-zone\"
          onDrop={handleDrop}
          onDragOver={handleDragOver}
        >
          <div className=\"drop-zone-content\">
            <p>{t('camera.dragDropHere')}</p>
            <p>{t('common.or')}</p>
            <input
              type=\"file\"
              accept=\"image/*\"
              onChange={handleFileSelect}
              style={{ display: 'none' }}
              id=\"file-input\"
            />
            <label htmlFor=\"file-input\" className=\"upload-button\">
              {t('camera.selectFile')}
            </label>
          </div>
        </div>
      ) : (
        <div className=\"preview-container\">
          <img src={preview} alt=\"Preview\" className=\"preview-image\" />
          <div className=\"preview-actions\">
            <button onClick={clearFile} className=\"secondary-button\">
              {t('camera.retakePicture')}
            </button>
            <button 
              onClick={analyzeImage} 
              disabled={isAnalyzing}
              className=\"primary-button\"
            >
              {isAnalyzing ? t('camera.analyzing') : t('camera.analyzeImage')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};