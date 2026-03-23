import { scanAlgorithm } from './scan.js';
import { nearestCarAlgorithm } from './nearest.js';
import { roundRobinAlgorithm } from './roundrobin.js';

export const algorithms = {
  scan: scanAlgorithm,
  nearest: nearestCarAlgorithm,
  roundrobin: roundRobinAlgorithm,
};
