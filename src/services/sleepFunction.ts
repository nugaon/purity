export async function sleepFunction (milliseconds: number = 1000) {
  return new Promise(resolve => setTimeout(resolve, milliseconds))
};
