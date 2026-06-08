import React from "react";
import { Route, Routes, BrowserRouter } from "react-router-dom";
import { App } from "zmp-ui";
import { LanguageProvider } from "./context/LanguageContext";
import Layout from "./components/Layout";
import HomePage from "./pages/HomePage";
import ChatPage from "./pages/ChatPage";
import VisitInfoPage from "./pages/VisitInfoPage";
import PlacesPage from "./pages/PlacesPage";
import PlaceDetailPage from "./pages/PlaceDetailPage";
import DigitalGuidePage from "./pages/DigitalGuidePage";
import FeedbackPage from "./pages/FeedbackPage";
import AnnouncementsPage from "./pages/AnnouncementsPage";
import MapPage from "./pages/MapPage";
import ProfilePage from "./pages/ProfilePage";

export const MyApp: React.FC = () => {
  return (
    <App>
      <LanguageProvider>
        <BrowserRouter>
          <Layout>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/chat" element={<ChatPage />} />
              <Route path="/info" element={<VisitInfoPage />} />
              <Route path="/places" element={<PlacesPage />} />
              <Route path="/places/:slug" element={<PlaceDetailPage />} />
              <Route path="/digital-guide" element={<DigitalGuidePage />} />
              <Route path="/feedback" element={<FeedbackPage />} />
              <Route path="/announcements" element={<AnnouncementsPage />} />
              <Route path="/map" element={<MapPage />} />
              <Route path="/profile" element={<ProfilePage />} />
            </Routes>
          </Layout>
        </BrowserRouter>
      </LanguageProvider>
    </App>
  );
};

export default MyApp;
