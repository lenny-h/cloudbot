export function createDiffViewString(
  changes: Array<{ value: string; added?: boolean; removed?: boolean }>,
  isText: boolean,
) {
  let diffString = "";

  if (isText) {
    changes.forEach((change) => {
      if (change.added) {
        diffString += `/+/+${change.value}/+/+`;
      } else if (change.removed) {
        diffString += `/-/-${change.value}/-/-`;
      } else {
        diffString += change.value;
      }
    });
  } else {
    changes.forEach((change) => {
      if (change.added) {
        change.value.split("\n").forEach((line) => {
          diffString += `++ ${line}\n`;
        });
      } else if (change.removed) {
        change.value.split("\n").forEach((line) => {
          diffString += `-- ${line}\n`;
        });
      } else {
        change.value.split("\n").forEach((line) => {
          diffString += `   ${line}\n`;
        });
      }
    });
  }

  return diffString;
}
