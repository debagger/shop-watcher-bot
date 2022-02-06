export const getRandomsFromArray = <T>(arr: T[], count: number) => {
  const res: T[] = [];
  for (let index = 0; index < count; index++) {
    const random_idx = Math.floor(Math.random() * (arr.length - 1));
    res.push(arr[random_idx]);
  }
  return res;
};
