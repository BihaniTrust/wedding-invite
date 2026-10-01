import { useEffect, useRef, useState } from "react";
import "./ScrollVideo.css";
import Butterflies from "./Butterflies";
import ScratchReveal from "./ScratchReveal";

export default function ScrollVideo({
  src = "/wedding-scroll.mp4",
  startTime = 0,
  endTime,
  pauseAt,
  coverFrom,
  scratchArea = { left: 22, top: 44, width: 56, height: 13 },
  debug = false,
}) {
  const sectionRef = useRef(null);
  const videoRef = useRef(null);
  const debugRef = useRef(null);

  const targetTimeRef = useRef(startTime);
  const animationRef = useRef(null);

  const videoReadyRef = useRef(false);
  const revealedRef = useRef(false);

  const phaseRef = useRef(0);
  const [phase, setPhase] = useState(0);

  const hasPause = typeof pauseAt === "number";

  const handleReveal = () => {
    revealedRef.current = true;
    phaseRef.current = 0;
    setPhase(0);

    // Reveal ke baad turant current scroll position se video continue
    updateTarget();
  };

  // -----------------------------
  // SCROLL → VIDEO TIME
  // -----------------------------
  const updateTarget = () => {
    const section = sectionRef.current;
    const video = videoRef.current;

    if (!section || !video) return;
    if (!video.duration || !videoReadyRef.current) return;

    const sectionTop =
      section.getBoundingClientRect().top + window.scrollY;

    const scrollable =
      section.offsetHeight - window.innerHeight;

    if (scrollable <= 0) return;

    let progress =
      (window.scrollY - sectionTop) / scrollable;

    progress = Math.max(0, Math.min(progress, 1));

    const end =
      typeof endTime === "number"
        ? Math.min(endTime, video.duration)
        : Math.max(video.duration - 0.05, 0);

    let target =
      startTime + progress * (end - startTime);

    // Scratch/pause
    if (
      hasPause &&
      !revealedRef.current
    ) {
      target = Math.min(target, pauseAt);
    }

    target = Math.max(
      startTime,
      Math.min(target, end)
    );

    targetTimeRef.current = target;
  };

  useEffect(() => {
    const section = sectionRef.current;
    const video = videoRef.current;

    if (!section || !video) return;

    let touchY = 0;

    const coverStart =
      coverFrom ??
      (hasPause
        ? Math.max(pauseAt - 0.5, startTime)
        : 0);

    // -----------------------------
    // VIDEO READY
    // -----------------------------
    const onLoadedMetadata = () => {
      videoReadyRef.current = true;

      video.pause();

      try {
        video.currentTime = startTime;
      } catch (error) {
        console.log("Initial seek:", error);
      }

      updateTarget();
    };

    const onLoadedData = () => {
      videoReadyRef.current = true;
      updateTarget();
    };

    // -----------------------------
    // SCROLL
    // -----------------------------
    const onScroll = () => {
      updateTarget();
    };

    const onResize = () => {
      updateTarget();
    };

    // -----------------------------
    // ANIMATION LOOP
    // -----------------------------
    const animate = () => {
      if (
        videoReadyRef.current &&
        video.duration
      ) {
        const target =
          targetTimeRef.current;

        const difference =
          Math.abs(
            video.currentTime - target
          );

        if (difference > 0.01) {
          try {
            video.currentTime = target;
          } catch (error) {
            console.log(
              "Video seek error:",
              error
            );
          }
        }

        // -----------------------------
        // SCRATCH PHASE
        // -----------------------------
        if (
          hasPause &&
          !revealedRef.current
        ) {
          const current =
            video.currentTime;

          let nextPhase = 0;

          if (
            current >= pauseAt - 0.12
          ) {
            nextPhase = 2;
          } else if (
            current >= coverStart
          ) {
            nextPhase = 1;
          }

          if (
            nextPhase !== phaseRef.current
          ) {
            phaseRef.current =
              nextPhase;

            setPhase(nextPhase);
          }
        }

        // -----------------------------
        // DEBUG
        // -----------------------------
        if (debugRef.current) {
          debugRef.current.textContent =
            `video: ${video.currentTime.toFixed(
              2
            )}s / ${(
              video.duration || 0
            ).toFixed(1)}s`;
        }
      }

      animationRef.current =
        requestAnimationFrame(
          animate
        );
    };

    // -----------------------------
    // MOUSE WHEEL
    // -----------------------------
    const onWheel = (e) => {
      if (
        !hasPause ||
        revealedRef.current ||
        e.deltaY <= 0
      ) {
        return;
      }

      const sectionTop =
        section.getBoundingClientRect()
          .top + window.scrollY;

      const scrollable =
        section.offsetHeight -
        window.innerHeight;

      if (scrollable <= 0) return;

      const progress =
        (window.scrollY - sectionTop) /
        scrollable;

      const end =
        typeof endTime === "number"
          ? Math.min(
              endTime,
              video.duration || endTime
            )
          : video.duration || 1;

      const pauseProgress =
        (pauseAt - startTime) /
        Math.max(
          end - startTime,
          0.001
        );

      // Scratch point par ruk jao
      if (
        progress >=
        pauseProgress - 0.003
      ) {
        e.preventDefault();

        // Exact pause position par le jao
        const targetScroll =
          sectionTop +
          pauseProgress * scrollable;

        window.scrollTo({
          top: targetScroll,
          behavior: "auto",
        });
      }
    };

    // -----------------------------
    // TOUCH START
    // -----------------------------
    const onTouchStart = (e) => {
      touchY =
        e.touches[0].clientY;
    };

    // -----------------------------
    // TOUCH MOVE
    // -----------------------------
    const onTouchMove = (e) => {
      if (
        !hasPause ||
        revealedRef.current
      ) {
        touchY =
          e.touches[0].clientY;
        return;
      }

      const currentY =
        e.touches[0].clientY;

      const dy =
        touchY - currentY;

      if (dy > 0) {
        const sectionTop =
          section.getBoundingClientRect()
            .top + window.scrollY;

        const scrollable =
          section.offsetHeight -
          window.innerHeight;

        if (scrollable > 0) {
          const progress =
            (window.scrollY -
              sectionTop) /
            scrollable;

          const end =
            typeof endTime === "number"
              ? Math.min(
                  endTime,
                  video.duration ||
                    endTime
                )
              : video.duration || 1;

          const pauseProgress =
            (pauseAt - startTime) /
            Math.max(
              end - startTime,
              0.001
            );

          if (
            progress >=
              pauseProgress - 0.003 &&
            e.cancelable
          ) {
            e.preventDefault();
          }
        }
      }

      touchY = currentY;
    };

    // -----------------------------
    // EVENTS
    // -----------------------------
    video.addEventListener(
      "loadedmetadata",
      onLoadedMetadata
    );

    video.addEventListener(
      "loadeddata",
      onLoadedData
    );

    window.addEventListener(
      "scroll",
      onScroll,
      { passive: true }
    );

    window.addEventListener(
      "resize",
      onResize
    );

    window.addEventListener(
      "wheel",
      onWheel,
      { passive: false }
    );

    window.addEventListener(
      "touchstart",
      onTouchStart,
      { passive: true }
    );

    window.addEventListener(
      "touchmove",
      onTouchMove,
      { passive: false }
    );

    // Start animation
    animationRef.current =
      requestAnimationFrame(
        animate
      );

    // Initial calculation
    updateTarget();

    // -----------------------------
    // CLEANUP
    // -----------------------------
    return () => {
      video.removeEventListener(
        "loadedmetadata",
        onLoadedMetadata
      );

      video.removeEventListener(
        "loadeddata",
        onLoadedData
      );

      window.removeEventListener(
        "scroll",
        onScroll
      );

      window.removeEventListener(
        "resize",
        onResize
      );

      window.removeEventListener(
        "wheel",
        onWheel
      );

      window.removeEventListener(
        "touchstart",
        onTouchStart
      );

      window.removeEventListener(
        "touchmove",
        onTouchMove
      );

      cancelAnimationFrame(
        animationRef.current
      );
    };
  }, [
    startTime,
    endTime,
    pauseAt,
    coverFrom,
    hasPause,
  ]);

  return (
    <section
      ref={sectionRef}
      className="scroll-video"
    >
      <div className="scroll-video__sticky">

        <div className="scroll-video__frame">

          <div className="scroll-video__stage">

            <video
              ref={videoRef}
              className="scroll-video__player"
              src={src}
              muted
              playsInline
              preload="auto"
              webkit-playsinline="true"
            />

            <Butterflies />

            {hasPause && (
              <ScratchReveal
                phase={phase}
                area={scratchArea}
                onReveal={handleReveal}
              />
            )}

            {debug && (
              <div
                ref={debugRef}
                className="scroll-video__debug"
              />
            )}

          </div>

        </div>

      </div>
    </section>
  );
}