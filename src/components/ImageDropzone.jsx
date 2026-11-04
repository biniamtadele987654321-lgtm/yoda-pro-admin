import { UploadCloud, X } from "lucide-react";
import { useRef, useState } from "react";

export default function ImageDropzone({ value, onChange, onFileChange, compact = false, promptText = "Drop your image here, or browse" }) {
  const inputRef = useRef(null);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState("");

  function readFile(file) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Choose an image file (JPG, PNG, GIF or WEBP).");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("Image must be smaller than 5 MB.");
      return;
    }
    setError("");
    const reader = new FileReader();
    reader.onload = () => {
      onChange(String(reader.result));
      onFileChange?.(file);
    };
    reader.onerror = () => setError("The image could not be read. Please try another file.");
    reader.readAsDataURL(file);
  }

  return (
    <div>
      <input
        ref={inputRef}
        className="sr-only"
        type="file"
        accept="image/jpeg,image/png,image/gif,image/webp"
        onChange={(event) => readFile(event.target.files?.[0])}
      />
      {value ? (
        <div className={`image-preview ${compact ? "image-preview-compact" : ""}`}>
          <img src={value} alt="Selected upload preview" />
          <button className="image-remove" type="button" aria-label="Remove image" onClick={() => { onChange(""); onFileChange?.(null); }}>
            <X size={15} />
          </button>
          <button className="image-change" type="button" onClick={() => inputRef.current?.click()}>Change image</button>
        </div>
      ) : (
        <button
          type="button"
          className={`dropzone ${dragging ? "dropzone-active" : ""} ${compact ? "dropzone-compact" : ""}`}
          onClick={() => inputRef.current?.click()}
          onDragOver={(event) => { event.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={(event) => {
            event.preventDefault();
            setDragging(false);
            readFile(event.dataTransfer.files?.[0]);
          }}
        >
          <span className="dropzone-icon"><UploadCloud size={compact ? 20 : 24} /></span>
          <strong>{promptText.includes("click") ? promptText : <>{promptText}, or <span>browse</span></>}</strong>
          {!compact && <small>JPG, JPEG, PNG or GIF · Max 5 MB</small>}
        </button>
      )}
      {error && <p className="field-error" role="alert">{error}</p>}
    </div>
  );
}
