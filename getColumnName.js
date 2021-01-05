const colName = (number) => {
  const ordA = "A".charCodeAt(0);
  const ordZ = "Z".charCodeAt(0);
  const len = ordZ - ordA + 1;

  let name = "";
  while (number >= 0) {
    name = String.fromCharCode((number % len) + ordA) + name;
    number = Math.floor(number / len) - 1;
  }
  return name;
};

console.log(colName(174));
