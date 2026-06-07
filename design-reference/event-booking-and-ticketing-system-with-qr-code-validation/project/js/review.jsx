// Tiketi — design-review chrome. NOT product UI.
// Per-screen state toggle (Loaded / Skeleton / Empty / Error ...) + return-to-launcher.

const ReviewCtx = React.createContext({ register: () => {}, state: "loaded" });

const STATE_LABEL = {
  loaded: "Loaded", skeleton: "Skeleton", empty: "Empty", error: "Error",
  soldout: "Sold out", waiting: "Waiting", timeout: "Timeout", confirmed: "Confirmed",
  live: "Live", noevent: "No event", downloading: "Fetching", ready: "Ready", failed: "Failed",
};

// Hook: a screen registers its id/name/available states; gets back the active state.
function useScreen(id, name, states = ["loaded"]) {
  const ctx = React.useContext(ReviewCtx);
  const key = states.join(",");
  React.useEffect(() => { ctx.register({ id, name, states }); }, [id, name, key]);
  return ctx.state;
}

function ReviewBar({ meta, state, onState, onHome }) {
  if (!meta) return null;
  return (
    <div className="rv-bar" role="region" aria-label="Design review controls">
      <button className="rv-home" aria-label="Back to role launcher" title="Role launcher" onClick={onHome}>
        <Icon name="grid-2x2" size={16} />
      </button>
      <span className="rv-id">{meta.id}</span>
      <span className="rv-name">{meta.name}</span>
      {meta.states.length > 1 && (
        <React.Fragment>
          <span className="rv-sep" />
          <div className="rv-states" role="tablist" aria-label="Screen state">
            {meta.states.map((s) => (
              <button key={s} role="tab" aria-selected={state === s}
                className={"rv-state" + (state === s ? " on" : "")}
                onClick={() => onState(s)}>{STATE_LABEL[s] || s}</button>
            ))}
          </div>
        </React.Fragment>
      )}
    </div>
  );
}

function ReviewProvider({ onHome, children }) {
  const [meta, setMeta] = React.useState(null);
  const [stateMap, setStateMap] = React.useState({});

  const register = React.useCallback((m) => {
    setMeta((prev) => (prev && prev.id === m.id && prev.name === m.name && prev.states.join() === m.states.join()) ? prev : m);
  }, []);

  const cur = meta ? (stateMap[meta.id] != null ? stateMap[meta.id] : meta.states[0]) : "loaded";
  const setState = (v) => { if (meta) setStateMap((sm) => ({ ...sm, [meta.id]: v })); };

  return (
    <ReviewCtx.Provider value={{ register, state: cur }}>
      {children}
      <ReviewBar meta={meta} state={cur} onState={setState} onHome={onHome} />
    </ReviewCtx.Provider>
  );
}

Object.assign(window, { ReviewCtx, useScreen, ReviewProvider });
