import compose from "./compose";

export default function applyMiddleware({ get, call }, middlewares) {
  const fakeCall = () => {
    throw new Error(
      "Dispatching while constructing your middleware is not allowed. " +
        "Other middleware would not be applied to this dispatch."
    );
  };

  const middlewareApi = {
    get,
    call: fakeCall
  };

  const chain = middlewares.map((middleware) => middleware(middlewareApi));
  const composedCall = compose(...chain)(call);

  return {
    get,
    call: composedCall
  };
}
