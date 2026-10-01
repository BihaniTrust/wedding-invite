import { useEffect, useState } from "react";
import "./Butterflies.css";

const BLUE = "/images/blue.png";
const PINK = "/images/pink.png";
const GOLD = "/images/gold.png";

const FLIES = [
  { img: BLUE,   s: 40, dur: 20, delay: 0,   flap: 0.34, off: 0, p: [[10, 24], [36, 26], [40, 42], [12, 40]] },
  { img: GOLD,   s: 32, dur: 24, delay: -7,  flap: 0.30, off: 0, p: [[56, 38], [76, 42], [74, 60], [54, 56]] },
  { img: PINK,   s: 34, dur: 26, delay: -13, flap: 0.36, off: 0, p: [[12, 66], [44, 64], [46, 84], [14, 82]] },
];

function angleBetween(a, b) {
  const dx = (b[0] - a[0]) *  9;
  const dy = (b[1] - a[1]) * 16;
  return (Math.atan2(dx, -dy) * 180) / Math.PI;
}


function getHeadings(p) {
  const a = [angleBetween(p[0], p[1])];
  for (let i = 1; i < 4; i++) {
    let v = angleBetween(p[i], p[(i + 1) % 4]);
    while (v - a[i - 1] > 180) v -= 360;
    while (v - a[i - 1] < -180) v += 360;
    a.push(v);
  }
  let start = a[3];
  while (start - a[0] > 180) start -= 360;
  while (start - a[0] < -180) start += 360;
  return { a, start };
}

function Butterfly({ img, s, dur, delay, flap, off = 0, p }) {
  const { a, start } = getHeadings(p);

  const style = {
    "--x0": `${p[0][0]}%`, "--y0": `${p[0][1]}%`,
    "--x1": `${p[1][0]}%`, "--y1": `${p[1][1]}%`,
    "--x2": `${p[2][0]}%`, "--y2": `${p[2][1]}%`,
    "--x3": `${p[3][0]}%`, "--y3": `${p[3][1]}%`,
    "--a0": `${a[0]}deg`,
    "--a1": `${a[1]}deg`,
    "--a2": `${a[2]}deg`,
    "--a3": `${a[3]}deg`,
    "--as": `${start}deg`,
    "--off": `${off}deg`,
    "--dur": `${dur}s`,
    "--delay": `${delay}s`,
    "--flap": `${flap}s`,
    width: s,
  };

  return (
    <div className="butterfly" style={style}>
      <div className="butterfly__dir">
        <img className="butterfly__img" src={img} alt="" draggable="false" />
      </div>
    </div>
  );
}

export default function Butterflies() {
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const onScroll = () => setStarted(window.scrollY > 20);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div
      className={`butterflies ${started ? "butterflies--on" : ""}`}
      aria-hidden="true"
    >
      {FLIES.map((f, i) => (
        <Butterfly key={i} {...f} />
      ))}
    </div>
  );
}