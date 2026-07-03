## 1. Type definition — replace tags with metadata

- [x] 1.1 Replace `tags?: string[]` with `metadata?: Record<string, string>` in `ParsedFile` interface in [src/types/curve.ts](src/types/curve.ts)
- [x] 1.2 Replace `tags: string[]` with `metadata: Record<string, string>` in `FormatInfo` interface in [src/parser/detectFormat.ts](src/parser/detectFormat.ts)

## 2. Format detection — metadata recognition

- [x] 2.1 Update `isCommentLine` in [src/parser/detectFormat.ts](src/parser/detectFormat.ts) to recognize lines starting with `"` as comment/metadata lines
- [x] 2.2 Rename `extractTags` to `extractMetadata` in [src/parser/detectFormat.ts](src/parser/detectFormat.ts), return `Record<string, string>` — parse `"Key"\t"Value"` format, strip quotes from both key and value
- [x] 2.3 Add quote-stripping helper (strip surrounding `"` from a string, no-op if not quoted)

## 3. Format detection — robust data start

- [x] 3.1 Expand `findDataStartLine` in [src/parser/detectFormat.ts](src/parser/detectFormat.ts) to search the full `lines` array instead of the 5-line sample
- [x] 3.2 Update `detectFormat` to pass full `lines` (not `sampleLines`) to `findDataStartLine` and `extractMetadata`
- [x] 3.3 Update `detectFormat` return to use `metadata` instead of `tags`

## 4. File parsing — wire up metadata

- [x] 4.1 Update `parseFileContent` in [src/parser/parseFile.ts](src/parser/parseFile.ts) to use `metadata` from `FormatInfo` and remove `tags` references
- [x] 4.2 Verify `parseDataRows` correctly parses scientific notation data (already works, confirm with real file)

## 5. Test data and validation

- [x] 5.1 Replace [test/sample_tags.arw](test/sample_tags.arw) content with real ARW format (quoted key-value metadata, >5 metadata lines, scientific notation data)
- [x] 5.2 Manually verify `parseFileContent` correctly parses `raw_data/empower_raw3570.arw` without errors