
import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider } from './AppContext';
import { Layout } from './components/Layout';
import { Home } from './pages/Home';
import { AddEditLink } from './pages/AddEditLink';
import { AddGalleryLinks } from './pages/AddGalleryLinks';
import { Settings } from './pages/Settings';
import { ActorManagement } from './pages/ActorManagement';
import { AddEditActor } from './pages/AddEditActor';
import { TagManagement } from './pages/TagManagement';
import { AddEditTag } from './pages/AddEditTag';
import { CoomerManagement } from './pages/CoomerManagement';
import { AddEditCoomer } from './pages/AddEditCoomer';
import { CoomerDetail } from './pages/CoomerDetail';
import { AddCoomerSocials } from './pages/AddCoomerSocials';
import { CoomerImageViewer } from './pages/CoomerImageViewer';
import { ActorLinks } from './pages/ActorLinks';
import { TagLinks } from './pages/TagLinks';
import { PreviewImage } from './pages/PreviewImage';
import { ImageCropPage } from './pages/ImageCropPage';
import { HanimeManagement } from './pages/HanimeManagement';
import { AddEditHanime } from './pages/AddEditHanime';
import { EditEpisode } from './pages/EditEpisode';
import { HanimeDetail } from './pages/HanimeDetail';
import { SecondCovers } from './pages/SecondCovers';
import { AddEpisodes } from './pages/AddEpisodes';

const App: React.FC = () => {
  return (
    <AppProvider>
      <Router>
        <Routes>
          <Route path="/preview/:id" element={<PreviewImage />} />
          <Route path="/coomer/:id/media/:tab/:index" element={<CoomerImageViewer />} />
          <Route path="*" element={
            <Layout>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/add" element={<AddEditLink />} />
                <Route path="/edit/:id" element={<AddEditLink />} />
                <Route path="/add-gallery" element={<AddGalleryLinks />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="/manage-actors" element={<ActorManagement />} />
                <Route path="/manage-actors/add" element={<AddEditActor />} />
                <Route path="/manage-actors/edit/:id" element={<AddEditActor />} />
                <Route path="/manage-tags" element={<TagManagement />} />
                <Route path="/manage-tags/add" element={<AddEditTag />} />
                <Route path="/manage-tags/edit/:id" element={<AddEditTag />} />
                <Route path="/manage-hanime" element={<HanimeManagement />} />
                <Route path="/manage-hanime/add" element={<AddEditHanime />} />
                <Route path="/manage-hanime/edit/:id" element={<AddEditHanime />} />
                <Route path="/manage-hanime/second-covers" element={<SecondCovers />} />
                <Route path="/manage-hanime/episodes" element={<AddEpisodes />} />
                <Route path="/edit-episode/:hanimeId/:episodeId" element={<EditEpisode />} />
                <Route path="/hanime/:id" element={<HanimeDetail />} />
                <Route path="/manage-coomers" element={<CoomerManagement />} />
                <Route path="/manage-coomers/add" element={<AddEditCoomer />} />
                <Route path="/manage-coomers/edit/:id" element={<AddEditCoomer />} />
                <Route path="/coomer/:id" element={<CoomerDetail />} />
                <Route path="/coomer/:id/add-socials" element={<AddCoomerSocials />} />
                <Route path="/coomer/:id/add-socials/:postId" element={<AddCoomerSocials />} />
                <Route path="/actor/:id" element={<ActorLinks />} />
                <Route path="/tag/:id" element={<TagLinks />} />
                <Route path="/crop" element={<ImageCropPage />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Layout>
          } />
        </Routes>
      </Router>
    </AppProvider>
  );
};

export default App;
