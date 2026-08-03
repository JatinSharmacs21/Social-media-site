import {
  BrowserRouter as Router,
  Routes,
  Route,
} from "react-router-dom";

import Landing from "./pages/Landing";
import Feed from "./pages/Feed";
import Profile from "./pages/Profile";
import Search from "./pages/Search";
import Reels from "./pages/Reels";
import Notifications from "./pages/Notifications";
import Whispers from "./pages/Whispers";

import ProtectedRoute from "./components/ProtectedRoute";
import MainLayout from "./components/MainLayout";
import ScrollToTop from "./components/ScrollToTop";
import VybeRoom from "./pages/VybeRoom";
import VybeDrops from "./pages/VybeDrops";

function App() {
  return (
    <Router>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<Landing />} />

        <Route path="/reset-password/:token" element={<Landing />} />

        <Route
          path="/feed"
          element={
            <ProtectedRoute>
              <MainLayout>
                <Feed />
              </MainLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/notifications"
          element={
            <ProtectedRoute>
              <MainLayout>
                <Notifications />
              </MainLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/whispers"
          element={
            <ProtectedRoute>
              <MainLayout>
                <Whispers />
              </MainLayout>
            </ProtectedRoute>
          }
        />
        <Route
            path="/vybe-room"
            element={
           <ProtectedRoute>
           <MainLayout>
           <VybeRoom />
          </MainLayout>
        </ProtectedRoute>
          }
        />

        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <MainLayout>
                <Profile />
              </MainLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/profile/:userId"
          element={
            <ProtectedRoute>
              <MainLayout>
                <Profile />
              </MainLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/search"
          element={
            <ProtectedRoute>
              <MainLayout>
                <Search />
              </MainLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/reels"
          element={
            <ProtectedRoute>
              <MainLayout>
                <Reels />
              </MainLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/vybe-drops"
          element={
          <ProtectedRoute>
          <MainLayout>
          <VybeDrops />
          </MainLayout>
          </ProtectedRoute>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;