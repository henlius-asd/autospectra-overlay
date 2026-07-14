# robust-data-detection Delta Specification

## MODIFIED Requirements

### Requirement: Data start line detection beyond 5-line sample window
The system SHALL search the entire file to locate the first numeric data line, rather than limiting the search to a fixed 5-line sample window. When the file is identified as ARW V2 at `parseFileContent` entry, the system SHALL skip the generic `findDataStartLine` path entirely and use the V2-specific data-start detection defined in `arw-v2-parsing` (first line matching the two-column numeric pattern after the metadata block). There is no header row detection — `findDataStartLine` returns the first line where `isNumericLine` returns true, and `detectHeader` does not identify header rows for letter-starting lines (they are classified as comments by `isCommentLine`).

#### Scenario: Metadata section longer than 5 lines (V1 / generic)
- **WHEN** a non-V2 file has 7 metadata lines before the first numeric data line
- **THEN** `findDataStartLine` returns 7 (0-indexed), correctly identifying line 7 as the first data row

#### Scenario: No metadata — data starts at line 0
- **WHEN** a file has numeric data starting at line 0 without any metadata
- **THEN** `findDataStartLine` returns 0

#### Scenario: Data with non-numeric leading lines (no header detection)
- **WHEN** a file has letter-starting lines like `Time,ChannelA,ChannelB` followed by numeric data
- **THEN** `findDataStartLine` returns the index of the first numeric data line (skipping the letter-starting lines as non-numeric); `detectHeader` does NOT identify the letter-starting line as a header (it is classified as a comment/metadata line by `isCommentLine`)

#### Scenario: ARW V2 file bypasses generic detection
- **WHEN** the input is identified as ARW V2 (see `arw-v2-parsing` 识别规则)
- **THEN** `findDataStartLine` is not invoked for this file; data start is determined by `parseEmpowerV2` as the first line matching the two-column numeric pattern