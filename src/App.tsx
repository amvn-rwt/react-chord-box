import ChordDiagram from "./components/chord-diagram/chord-diagram";

function App() {
  return (
    <>
      <ChordDiagram chord="C" width={80} height={100} />
      <ChordDiagram chord="G" width={100} height={150} />
    </>
  );
}

export default App;
