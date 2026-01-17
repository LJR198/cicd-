import React from 'react';
import ChristmasTree from './ChristmasTree';
import './App.css';

function App() {
  return (
    <div className="App">
      <h1>3D Christmas Tree</h1>
      <div className="canvas-container">
        <ChristmasTree />
      </div>
    </div>
  );
}

export default App;
