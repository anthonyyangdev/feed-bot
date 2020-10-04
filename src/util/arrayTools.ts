
const arrayCompare = <V> (
  arr: V[],
  key: (v: V) => number,
  compare: (a: number, b: number) => boolean
): V | null => {
  let extrema: number | null = null;
  let extrema_value: V | null = null;
  for (const v of arr) {
    const num_of_v = key(v);
    if (!extrema || (compare(num_of_v, extrema))) {
      extrema = num_of_v;
      extrema_value = v;
    }
  }
  return extrema_value;
};

export const arrayMax = <V> (arr: V[], key: (v: V) => number): V | null => {
  return arrayCompare(arr, key, (a, b) => a > b);
};

export const arrayMin = <V> (arr: V[], key: (v: V) => number): V | null => {
  return arrayCompare(arr, key, (a, b) => a < b);
};
