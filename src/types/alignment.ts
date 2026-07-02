export interface AlignmentResult {
  xOffset: number;
  correlationScore: number;
}

export interface AlignmentAlgorithm {
  name: string;
  align(
    refData: [number, number][],
    targetData: [number, number][],
    roiStart: number,
    roiEnd: number,
  ): AlignmentResult;
}