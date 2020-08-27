// fn1 is great
export function fn1() {
  return null;
}

export default function fn2() {
  return null;
}

export const fn3 = () => {
  return null;
};

// This function is the third function
// and I don't know what to do
export default fn4 = () => {
  return null;
};

const functionName1 = `export function fn1() {}`;

const functionName2 = `export const fn3 = () => {}`;

export const Status = {
  approved: `approved`,
  declined: `declined`,
};

// This object exports the 3 state of the app
export let State = {
  pending: 0,
  inprogress: 1,
  approved: 2,
};
