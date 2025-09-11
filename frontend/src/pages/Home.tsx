import React from "react";
import { Link } from "react-router-dom";

const Home: React.FC = () => (
  <div className="text-center mt-16">
    <h1 className="text-4xl font-bold mb-4">Welcome to Object Detection</h1>
    <p className="text-gray-300 mb-8">
      Detect weapons in real-time using webcam, CCTV, or uploaded files.
    </p>
    <div className="flex justify-center gap-4">
      <Link to="/livestream" className="bg-blue-600 px-6 py-3 rounded hover:bg-blue-700">
        Live Stream
      </Link>
      <Link to="/upload" className="bg-purple-600 px-6 py-3 rounded hover:bg-purple-700">
        Upload File
      </Link>
    </div>
  </div>
);

export default Home;
