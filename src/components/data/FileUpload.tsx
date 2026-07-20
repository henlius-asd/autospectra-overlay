import { useCallback, useState, useRef, type DragEvent } from 'react';
import { parseFileContent, ParseError } from '@/parser';

interface FileUploadProps {
  onFilesParsed: (results: { file: File; parsed: ReturnType<typeof parseFileContent> } | { file: File; error: string }) => void;
}

const SUPPORTED_EXTENSIONS = ['.arw', '.txt', '.csv'];

export default function FileUpload({ onFilesParsed }: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const processFiles = useCallback(
    (files: FileList) => {
      Array.from(files).forEach((file) => {
        const ext = '.' + file.name.split('.').pop()?.toLowerCase();
        if (!SUPPORTED_EXTENSIONS.includes(ext)) {
          onFilesParsed({
            file,
            error: `不支持的文件格式：${ext}（支持 .arw, .txt, .csv）`,
          });
          return;
        }

        const reader = new FileReader();
        reader.onload = () => {
          try {
            const content = reader.result as string;
            const parsed = parseFileContent(file.name, content);
            onFilesParsed({ file, parsed });
          } catch (e) {
            const msg = e instanceof ParseError ? e.message : `文件解析失败：${(e as Error).message}`;
            onFilesParsed({ file, error: msg });
          }
        };
        reader.onerror = () => {
          onFilesParsed({ file, error: '文件读取失败' });
        };
        reader.readAsText(file);
      });
    },
    [onFilesParsed],
  );

  const handleDragOver = (e: DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files);
    }
  };

  const handleClick = () => {
    inputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(e.target.files);
      // Reset so the same file can be re-selected
      e.target.value = '';
    }
  };

  return (
    <div
      className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors ${
        isDragging
          ? 'border-accent bg-accent-subtle'
          : 'border-line-strong hover:border-ink-faint'
      }`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={handleClick}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".arw,.txt,.csv"
        multiple
        className="hidden"
        onChange={handleFileChange}
      />
      <p className="text-sm text-ink-muted">
        拖拽数据文件到此处，或点击选择
      </p>
      <p className="text-xs text-ink-faint mt-1">
        支持 .arw / .txt / .csv
      </p>
    </div>
  );
}