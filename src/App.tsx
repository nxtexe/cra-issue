import React, { useState } from 'react';
import logo from './logo.svg';
import { getVideo } from './utils';
import { ConverterWorkerError, ConverterWorkerProgress, ConverterWorkerResult, Data } from './Workers/converter.worker';
import './App.css';

type ConverterWorkerEvent = ConverterWorkerProgress | ConverterWorkerResult | ConverterWorkerError;

declare global {
  interface Worker {
    postMessage<T>(message: T, transfer?: Transferable[]): void;
  }
}

const worker = new Worker(new URL('./Workers/converter.worker.ts', import.meta.url), {type: "module"});

function App() {
  const [progress, setProgress] = useState(0);
  const[url, setURL] = useState('');
  const downloadLink = document.querySelector<HTMLAnchorElement>('#download');

  function onStart() {
    URL.revokeObjectURL(url);
    setProgress(0);
    getVideo(new URL('./test.mp4', import.meta.url).href)
    .then((buffer) => worker.postMessage<Data>({data: buffer, name: 'test', inType: 'mp4', outType: 'mp3'}, [buffer]));
  }

  worker.onmessage = (event: MessageEvent<ConverterWorkerEvent>) => {
    switch(event.data.type) {
      case "result":
        if (downloadLink) {
          downloadLink.style.display = 'unset';
          const blob = new Blob([event.data.data], {type: 'audio/mpeg'});
          setURL(URL.createObjectURL(blob));
          downloadLink.download = "download.mp3";
          alert("Conversion Finished");
          downloadLink.onclick = () => {
            downloadLink.style.display = 'none';
          }
        }
      break;

      case "error":
        console.error(event.data.error);
      break;
        
      case "progress":
        setProgress(event.data.progress);
      break;
    }
  }
  return (
    <div className="App">
      <header className="App-header">
        <p className="progress">{(progress * 100).toFixed(2)}%</p>
        <img src={logo} className="App-logo" alt="logo" style={{transform: `rotate(${360 * progress}deg)`}} />
        <button onClick={onStart}>Start</button>
        <a
          id="download"
          className="download-link"
          href={url}
          style={{display: 'none'}}
        >
          Download Result
        </a>
      </header>
    </div>
  );
}

export default App;
