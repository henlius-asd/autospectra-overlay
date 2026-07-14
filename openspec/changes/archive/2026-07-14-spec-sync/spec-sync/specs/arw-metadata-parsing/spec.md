# arw-metadata-parsing Delta Specification

## MODIFIED Requirements

### Requirement: ARW metadata key-value parsing
The system SHALL parse Waters Empower ARW V1 file metadata lines in `"Key"\t"Value"` format and store them as a structured `Record<string, string>` dictionary. For ARW V2 files (无引号、行串联式元数据)，系统 SHALL 走独立的 `parseEmpowerV2` 分支，不经过 `detectFormat.extractMetadata`；V2 元数据重组规则见 `arw-v2-parsing` capability。两条分支最终都写入 `ParsedFile.metadata`，下游消费方无需感知版本差异。`metadata` SHALL always be an object containing at least `fileName`; it is never `undefined` even when no metadata lines exist.

#### Scenario: Parse key-value metadata from ARW V1 file
- **WHEN** an ARW V1 file contains metadata lines like `"SampleName"\t"ASD-E-2605127-001 NR"` and `"Channel Description"\t"PDA - 220 nm"`
- **THEN** the parser (via `detectFormat.extractMetadata`) extracts `metadata: { "SampleName": "ASD-E-2605127-001 NR", "Channel Description": "PDA - 220 nm" }` into the `ParsedFile` result

#### Scenario: Metadata values with spaces and special characters (V1)
- **WHEN** a V1 metadata value contains spaces, slashes, or colons (e.g., `"5/20/2026 5:03:01 AM CST"`)
- **THEN** the full value is preserved verbatim in the metadata dictionary after stripping surrounding double quotes

#### Scenario: Empty metadata section
- **WHEN** an ARW file has no metadata lines (data starts immediately)
- **THEN** `metadata` is `{ fileName }` (containing at least the original filename with extension) in the `ParsedFile` result; it is never `undefined`

#### Scenario: ARW V2 file metadata
- **WHEN** an ARW file is identified as V2 (see `arw-v2-parsing` for识别规则)
- **THEN** metadata is parsed by `parseEmpowerV2` using the 7-key ordered重组算法; V1 `extractMetadata` is not invoked for this file. `SamplingInterval` is NOT present in the metadata — the first data point's x-coordinate is used as the time coordinate of the first data point, not stored as a metadata field.