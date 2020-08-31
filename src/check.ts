import stonix from "./index";

const logic1 = {
  state: {
    count: 1,
  },
  decrease() {},
  flow({ when }) {
    return when();
  },
};

// noinspection JSUnusedLocalSymbols
const logic2 = {
  state: {
    age: "",
  },
  increase(by?: number) {},
  "#hello"() {},
};

const store = stonix(logic1).use(logic2);
const store2 = stonix(logic1);
const store3 = stonix([logic1, logic2]);
console.log(store.get().count, store.get().age, store.increase);
console.log(store2.get().count, store2.decrease, store3, store3.get("count"));
