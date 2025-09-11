import React from "react";
import { Link } from "react-router-dom";

const Navbar: React.FC = () => {
  return (
    <nav className="bg-gray-800 p-4 flex justify-between items-center">
      <Link to="/" className="text-lg font-bold">Object Detection</Link>
      <div className="flex gap-4">
        <Link to="/" className="hover:underline">Home</Link>
        <Link to="/livestream" className="hover:underline">Live Stream</Link>
        <Link to="/upload" className="hover:underline">Upload</Link>
      </div>
    </nav>
  );
};

export default Navbar;
