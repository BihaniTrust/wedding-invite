import ScrollVideo from "./components/ScrollVideo";

export default function App() {
  return (
    <>
      <ScrollVideo
  src="/wedding-scroll.mp4"
  endTime={49}
  startTime={0}
  pauseAt={3.8}
  coverFrom={3.3}
/>
    </>
  );
}