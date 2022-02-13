import * as React from "react";
import { match, PickAction, PickState } from "../src";
import { AuthFeature, useAuth, PublicAuth } from "./AuthFeature";

type Test = PickState<PublicAuth, "LOADED">;

type Test2 = PickAction<PublicAuth, "ADD_TODO">;

const Test = () => {
  const [auth, dispatch] = useAuth();

  match(auth, {
    LOADED: () => null,
  });

  return (
    <h2
      onClick={() => {
        dispatch({
          type: "ADD_TODO",
          todo: {
            completed: true,
            title: "Awesome",
          },
        });

        dispatch({
          type: "FETCH_TODOS",
          todos: [],
        });
      }}
    >
      Start editing to see some magic!
    </h2>
  );
};

export function App() {
  const [state, setState] = React.useState(true);

  return (
    <div className="App">
      <button
        onClick={() => {
          setState(!state);
        }}
      >
        toggle
      </button>
      {state ? (
        <AuthFeature>
          <Test />
        </AuthFeature>
      ) : null}
    </div>
  );
}
