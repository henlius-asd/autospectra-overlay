## MODIFIED Requirements

### Requirement: Data start line detection beyond 5-line sample window
The system SHALL search the entire file to locate the first numeric data line, rather than limiting the search to a fixed 5-line sample window. When the file is identified as ARW V2 at `parseFileContent` entry, the system SHALL skip the generic `findDataStartLine` path entirely and use the V2-specific data-start detection defined in `arw-v2-parsing` (first line matching the two-column numeric pattern after the metadata block).

#### Scenario: Metadata section longer than 5 lines (V1 / generic)
- **WHEN** a non-V2 file has 7 metadata lines before the first numeric data line
- **THEN** `findDataStartLine` returns 7 (0-indexed), correctly identifying line 7 as the first data row

#### Scenario: No metadata — data starts at line 0
- **WHEN** a file has numeric data starting at line 0 without any metadata
- **THEN** `findDataStartLine` returns 0

#### Scenario: Data with a header row
- **WHEN** a file has a header row like `Time,ChannelA,ChannelB` followed by numeric data
- **THEN** `findDataStartLine` returns the index of the first numeric data line (skipping the header), and `detectHeader` identifies the header row correctly

#### Scenario: ARW V2 file bypasses generic detection
- **WHEN** the input is identified as ARW V2 (see `arw-v2-parsing` 识别规则)
- **THEN** `findDataStartLine` is not invoked for this file; data start is determined by `parseEmpowerV2` as the first line matching the two-column numeric pattern

### Requirement: Quoted metadata line recognition
The system SHALL recognize lines starting with a double-quote character (`"`) as non-data metadata lines. This rule applies only to the generic detection path; ARW V2 files do not contain quoted lines and are identified by the absence of `"` (see `arw-v2-parsing`).

#### Scenario: Quoted metadata line classified as comment
- **WHEN** a line starts with `"` (e.g., `"SampleName"\t"ASD-E-2605127-001 NR"`)
- **THEN** `isCommentLine` returns `true` for that line

#### Scenario: Quoted metadata line excluded from data detection
- **WHEN** `findDataStartLine` encounters a line starting with `"`
- **THEN** the line is skipped and the search continues to the next line

### Requirement: Quote stripping from parsed values
The system SHALL strip surrounding double quotes from metadata keys and values before storing them in the metadata dictionary. V2 metadata values are never quoted and pass through without stripping.

#### Scenario: Quoted value stripped
- **WHEN** a metadata value is `"ASD-E-2605127-001 NR"` (with surrounding quotes)
- **THEN** the stored value is `ASD-E-2605127-001 NR` (without quotes)

#### Scenario: Unquoted value preserved
- **WHEN** a metadata value is already unquoted (e.g., `au`)
- **THEN** the value is stored as-is
