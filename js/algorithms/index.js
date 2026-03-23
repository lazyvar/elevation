import { scanAlgorithm } from './scan.js';
import { nearestCarAlgorithm } from './nearest.js';

export const algorithms = {
  scan: scanAlgorithm,
  nearest: nearestCarAlgorithm,
  roundrobin: scanAlgorithm,  // placeholder — replaced in Task 8
};
