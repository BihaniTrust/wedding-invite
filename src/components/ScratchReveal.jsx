import { useEffect, useRef, useState } from "react";
import "./ScratchReveal.css";

const W = 640; // scratch canvas ka internal size (quality)
const COLORS = ["#d9a93b", "#f0c14b", "#e8884a", "#e7a2b8", "#7fa9c9", "#9ccf9a", "#c2873a"];

/* ---------------- CONFETTI (celebration blast) ---------------- */
function Confetti({ fire, origin }) {
  const ref = useRef(null);

  useEffect(() => {
    if (!fire) return;
    const canvas = ref.current;
    const ctx = canvas.getContext("2d");
    const cw = canvas.width;
    const ch = canvas.height;
    let rafId;
    let parts = [];

    const burst = (x, y, n, power) => {
      for (let i = 0; i < n; i++) {
        const ang = Math.random() * Math.PI * 2;
        const sp = (0.4 + Math.random() * 0.6) * power;
        parts.push({
          x,
          y,
          vx: Math.cos(ang) * sp,
          vy: Math.sin(ang) * sp - power * 0.35,
          rot: Math.random() * 6.28,
          vr: (Math.random() - 0.5) * 0.4,
          size: 6 + Math.random() * 8,
          color: COLORS[(Math.random() * COLORS.length) | 0],
          shape: ["rect", "rect", "plus", "dot"][(Math.random() * 4) | 0],
          life: 0,
          max: 110 + Math.random() * 90,
        });
      }
    };

    burst((origin.x / 100) * cw, (origin.y / 100) * ch, 130, 16);
    const t1 = setTimeout(() => {
      burst(cw * 0.08, ch * 0.5, 50, 14);
      burst(cw * 0.92, ch * 0.5, 50, 14);
    }, 300);

    const tick = () => {
      ctx.clearRect(0, 0, cw, ch);
      parts = parts.filter((p) => p.life < p.max);

      for (const p of parts) {
        p.life++;
        p.vx *= 0.985;
        p.vy = p.vy * 0.985 + 0.35;
        p.x += p.vx;
        p.y += p.vy;
        p.rot += p.vr;

        const k = p.life / p.max;
        ctx.save();
        ctx.globalAlpha = k > 0.7 ? Math.max(1 - (k - 0.7) / 0.3, 0) : 1;
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.fillStyle = p.color;
        ctx.strokeStyle = p.color;

        if (p.shape === "rect") {
          ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
        } else if (p.shape === "plus") {
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(-p.size / 2, 0);
          ctx.lineTo(p.size / 2, 0);
          ctx.moveTo(0, -p.size / 2);
          ctx.lineTo(0, p.size / 2);
          ctx.stroke();
        } else {
          ctx.beginPath();
          ctx.arc(0, 0, p.size / 3, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      }

      if (parts.length) {
        rafId = requestAnimationFrame(tick);
      } else {
        ctx.clearRect(0, 0, cw, ch);
      }
    };

    rafId = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(rafId);
      clearTimeout(t1);
      ctx.clearRect(0, 0, cw, ch);
    };
  }, [fire, origin.x, origin.y]);

  return <canvas ref={ref} className="confetti" width={540} height={960} />;
}

/* ---------------- SCRATCH CARD ---------------- */
function drawFoil(ctx, w, h) {
  const g = ctx.createLinearGradient(0, 0, w, h);
  g.addColorStop(0, "#d6c79c");
  g.addColorStop(0.35, "#efe5c6");
  g.addColorStop(0.65, "#cbb98a");
  g.addColorStop(1, "#e6d9b4");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);

  for (let i = 0; i < 1100; i++) {
    ctx.fillStyle =
      Math.random() > 0.5 ? "rgba(255,255,255,0.28)" : "rgba(120,100,60,0.18)";
    ctx.fillRect(
      Math.random() * w,
      Math.random() * h,
      1.5 + Math.random() * 2.5,
      1.5 + Math.random() * 2.5
    );
  }
}

export default function ScratchReveal({
  phase = 0, // 0 = chhupa, 1 = dikh raha, 2 = scratch kar sakte ho
  area = { left: 22, top: 44, width: 56, height: 13 },
  onReveal,
  threshold = 0.45, // kitna scratch hone par date khule (0.45 = 45%)
}) {
  const canvasRef = useRef(null);
  const doneRef = useRef(false);
  const drawingRef = useRef(false);
  const lastRef = useRef(null);
  const moveCount = useRef(0);
  const [done, setDone] = useState(false);
  const [burst, setBurst] = useState(0);

  // area ka aspect card (9:16) ke hisaab se hamesha same rehta hai
  const H = Math.round((W * area.height * 16) / (area.width * 9));

  const getCtx = () =>
    canvasRef.current.getContext("2d", { willReadFrequently: true });

  useEffect(() => {
    drawFoil(getCtx(), W, H);
  }, [H]);

  const pos = (e) => {
    const r = canvasRef.current.getBoundingClientRect();
    return {
      x: ((e.clientX - r.left) / r.width) * W,
      y: ((e.clientY - r.top) / r.height) * H,
    };
  };

  const scratchTo = (p) => {
    const ctx = getCtx();
    const l = lastRef.current || p;
    ctx.globalCompositeOperation = "destination-out";
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.lineWidth = W * 0.1;
    ctx.beginPath();
    ctx.moveTo(l.x, l.y);
    ctx.lineTo(p.x + 0.01, p.y);
    ctx.stroke();
    lastRef.current = p;
  };

  const clearedRatio = () => {
    const data = getCtx().getImageData(0, 0, W, H).data;
    let clear = 0;
    let total = 0;
    for (let i = 3; i < data.length; i += 16) {
      total++;
      if (data[i] < 64) clear++;
    }
    return clear / total;
  };

  const finish = () => {
    doneRef.current = true;
    setDone(true);
    setBurst((b) => b + 1);
    if (onReveal) onReveal();
  };

  const check = () => {
    if (doneRef.current) return;
    if (clearedRatio() >= threshold) finish();
  };

  const down = (e) => {
    if (doneRef.current) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    drawingRef.current = true;
    lastRef.current = null;
    scratchTo(pos(e));
  };

  const move = (e) => {
    if (!drawingRef.current || doneRef.current) return;
    scratchTo(pos(e));
    moveCount.current += 1;
    if (moveCount.current % 6 === 0) check();
  };

  const up = () => {
    drawingRef.current = false;
    lastRef.current = null;
    check();
  };

  const cls = [
    "scratch",
    !done && phase >= 1 ? "scratch--show" : "",
    !done && phase === 2 ? "scratch--live" : "",
    done ? "scratch--done" : "",
  ].join(" ");

  return (
    <>
      <div
        className={cls}
        style={{
          left: `${area.left}%`,
          top: `${area.top}%`,
          width: `${area.width}%`,
          height: `${area.height}%`,
        }}
      >
        <canvas
          ref={canvasRef}
          className="scratch__canvas"
          width={W}
          height={H}
          onPointerDown={down}
          onPointerMove={move}
          onPointerUp={up}
          onPointerCancel={up}
          onContextMenu={(e) => e.preventDefault()}
        />
      </div>

      <Confetti
        fire={burst}
        origin={{
          x: area.left + area.width / 2,
          y: area.top + area.height / 2,
        }}
      />
    </>
  );
}