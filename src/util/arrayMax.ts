
export const arrayMax = <V> (arr: V[], key: (v: V) => number): V | null => {
  let maximum: number | null = null;
  let max_value: V | null = null;
  for (const v of arr) {
    const num_of_v = key(v);
    if (!maximum || (num_of_v > maximum)) {
      maximum = num_of_v;
      max_value = v;
    }
  }
  return max_value;
};
