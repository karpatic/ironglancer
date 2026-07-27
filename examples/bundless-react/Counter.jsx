const React = window.React;

export default function Counter() {
  const [count, setCount] = React.useState(0);

  return (
    <article className="demo-card">
      <span className="card-label">Live React state</span>
      <strong className="count">{count}</strong>
      <button type="button" onClick={() => setCount((value) => value + 1)}>
        Increment
      </button>
    </article>
  );
}
