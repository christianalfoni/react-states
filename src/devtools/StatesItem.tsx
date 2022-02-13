import * as React from "react";
import { HistoryItem } from "./Manager";
import { ExpandedStates } from "./ExpandedStates";
import { colors } from "./styles";

export const StatesItem = React.memo(
  ({
    id,
    history,
    transitions,
    toggleExpanded,
    isMounted,
    isExpanded,
    triggerTransitions,
  }: {
    id: string;
    toggleExpanded: (id: string) => void;
    history: HistoryItem[];
    transitions: {
      [key: string]: {
        [key: string]: Function;
      };
    };
    isMounted: boolean;
    isExpanded: boolean;
    triggerTransitions: () => void;
  }) => {
    const currentState = history.find(
      (item) => item.type === "state"
    )! as HistoryItem & { type: "state" };

    return (
      <li
        style={{
          padding: "0 2rem",
          fontSize: "18px",
          borderBottom: `1px solid ${colors.border}`,
          opacity: isMounted ? 1 : 0.5,
        }}
      >
        <div
          style={{
            cursor: "pointer",
            marginBottom: "0.5rem",
            marginTop: "0.5rem",
            display: "flex",
            alignItems: "center",
          }}
          onClick={() => {
            toggleExpanded(id);
          }}
        >
          <span
            style={{
              color: colors.text,
              marginRight: "0.5rem",
              fontSize: "14px",
            }}
          >
            {isExpanded ? "▼" : "▶"}
          </span>
          <span
            style={{
              color: colors.highlight,
              fontWeight: "bold",
              marginRight: "0.5rem",
            }}
          >
            {id}
          </span>{" "}
          <span style={{ color: colors.orange }}>
            {currentState.state.state}
          </span>
        </div>
        {isExpanded ? (
          <ExpandedStates
            triggerTransitions={triggerTransitions}
            history={history}
            transitions={transitions}
            currentState={currentState.state.state}
          />
        ) : null}
      </li>
    );
  }
);
