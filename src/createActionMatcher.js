const matchAny = () => true;

export default function createActionMatcher(key) {
  if (key === "*") return matchAny;
  if (key.indexOf(">") !== -1) {
    const keys = splitKey(key, ">");
    let index = 0;
    return (action) => {
      if (action === keys[index]) {
        index++;
      }
      if (index >= keys.length - 1) {
        index = 0;
        return true;
      }
      return false;
    };
  } else {
    const hasWildcard = key.indexOf("*") !== -1;
    const keys = splitKey(key, "|");
    if (hasWildcard) {
      const regex = new RegExp(
        "(" +
          keys
            .map((x) => x.replace(/\./g, "..").replace(/\*/g, ".*"))
            .join("|") +
          ")"
      );
      return (action) => regex.test(action);
    }
    if (keys.length === 1) {
      const firstKey = keys[0];
      return Object.assign((action) => action === firstKey, {
        actionType: firstKey,
      });
    }
    return Object.assign((action) => keys.includes(action), {
      actionTypeList: keys,
    });
  }
}

function splitKey(key, separator) {
  return key
    .split(separator)
    .map((key) => key.trim())
    .filter((x) => x);
}
