import { useCallback, useEffect, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import styles from './DropzoneField.module.css';

interface DropzoneFieldProps {
  id: string;
  label: string;
  multiple?: boolean;
  value: string[];
  onChange: (urls: string[]) => void;
  hint?: string;
}

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error('Could not read file.'));
    reader.readAsDataURL(file);
  });
}

export default function DropzoneField({ id, label, multiple = false, value, onChange, hint }: DropzoneFieldProps) {
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback(
    async (files: File[]) => {
      setError(null);
      const images = files.filter((f) => f.type.startsWith('image/'));
      if (images.length === 0) {
        setError('Please drop image files only.');
        return;
      }
      try {
        const urls = await Promise.all(images.map(readAsDataUrl));
        onChange(multiple ? [...value, ...urls] : [urls[0]]);
      } catch {
        setError('Could not read the dropped files.');
      }
    },
    [multiple, onChange, value],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': [] },
    multiple,
  });

  function removeAt(index: number) {
    onChange(value.filter((_, i) => i !== index));
  }

  // Revoke nothing: data URLs need no cleanup. Kept for future object-URL use.
  useEffect(() => undefined, []);

  return (
    <div className={styles.wrap}>
      <span id={`${id}-label`} className={styles.label}>{label}</span>
      <div {...getRootProps({ className: `${styles.dropzone}${isDragActive ? ` ${styles.dropActive}` : ''}` })} role="button" aria-labelledby={`${id}-label`} tabIndex={0}>
        <input {...getInputProps({ id })} />
        {isDragActive ? <p>Drop the image(s) here…</p> : <p>Drag &amp; drop {multiple ? 'images' : 'an image'} here, or click to browse</p>}
        {hint && <p className={styles.hint}>{hint}</p>}
      </div>
      {error && <p role="alert" className={styles.error}>{error}</p>}
      {value.length > 0 && (
        <div className={multiple ? styles.thumbGrid : styles.thumbSingle}>
          {value.map((src, i) => (
            <div key={`${i}-${src.slice(0, 32)}`} className={styles.thumb}>
              <img src={src} alt={multiple ? `Secondary image ${i + 1}` : 'Primary image preview'} />
              <button type="button" className={styles.thumbRemove} onClick={() => removeAt(i)} aria-label={`Remove image ${i + 1}`}>
                ×
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
