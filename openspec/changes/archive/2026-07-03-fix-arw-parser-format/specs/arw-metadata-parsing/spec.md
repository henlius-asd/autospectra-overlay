## ADDED Requirements

### Requirement: ARW metadata key-value parsing
The system SHALL parse Waters Empower ARW file metadata lines in `"Key"\t"Value"` format and store them as a structured `Record<string, string>` dictionary, replacing the legacy `tags` field.

#### Scenario: Parse key-value metadata from ARW file
- **WHEN** an ARW file contains metadata lines like `"SampleName"\t"ASD-E-2605127-001 NR"` and `"Channel Description"\t"PDA - 220 nm"`
- **THEN** the parser extracts `metadata: { "SampleName": "ASD-E-2605127-001 NR", "Channel Description": "PDA - 220 nm" }` into the `ParsedFile` result

#### Scenario: Metadata values with spaces and special characters
- **WHEN** a metadata value contains spaces, slashes, or colons (e.g., `"5/20/2026 5:03:01 AM CST"`)
- **THEN** the full value is preserved verbatim in the metadata dictionary after stripping surrounding double quotes

#### Scenario: Empty metadata section
- **WHEN** an ARW file has no metadata lines (data starts immediately)
- **THEN** `metadata` field is `undefined` in the `ParsedFile` result