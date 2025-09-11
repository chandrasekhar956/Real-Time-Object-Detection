import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import Home from "./pages/Home";
import LiveStream from "./pages/LiveStream";
import Upload from "./pages/Upload";

const App = () => {
  return (
    <Router>
      <div className="min-h-screen bg-gray-900 text-white">
        <nav className="p-4 bg-gray-800">
          <Link to="/" className="px-4">Home</Link>
          <Link to="/livestream" className="px-4">Live Stream</Link>
          <Link to="/upload" className="px-4">Upload</Link>
        </nav>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/livestream" element={<LiveStream />} />
          <Route path="/upload" element={<Upload />} />
        </Routes>
      </div>
    </Router>
  );
};

export default App;
