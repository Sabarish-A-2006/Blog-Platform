import { BrowserRouter, Navigate, Outlet, Route, Routes, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';
import HomePage from './pages/HomePage';
import ExplorePage from './pages/ExplorePage';
import PostPage from './pages/PostPage';
import { CreatePostPage, EditPostPage } from './pages/WritePage';
import { LoginPage, RegisterPage } from './pages/AuthPages';
import { AboutPage, AuthorPage, DashboardPage, MyPostsPage, ProfilePage } from './pages/WorkspacePages';
import NotFoundPage from './pages/NotFoundPage';

function RouteAccessibility() {
  const location = useLocation();
  useEffect(() => {
    let currentMain = null;
    function updateMain() {
      const main = document.querySelector('main');
      if (!main) return;
      const isNewMain = main !== currentMain;
      main.id = 'main-content';
      main.tabIndex = -1;
      const headingElement = main.querySelector('h1');
      const headingCopy = headingElement?.cloneNode(true);
      headingCopy?.querySelectorAll('br').forEach(lineBreak => lineBreak.replaceWith(' '));
      const heading = headingCopy?.textContent?.replace(/\s+/g, ' ').trim();
      if (headingElement) {
        headingElement.id ||= 'page-heading';
        main.setAttribute('aria-labelledby', headingElement.id);
      } else {
        main.removeAttribute('aria-labelledby');
        main.setAttribute('aria-label', 'Page content');
      }
      if (heading) document.title = `${heading} | BlogSphere`;
      else document.title = 'BlogSphere — Ideas worth sharing';
      if (isNewMain) main.focus({ preventScroll: true });
      currentMain = main;
    }
    updateMain();
    const root = document.getElementById('root');
    const observer = new MutationObserver(updateMain);
    if (root) observer.observe(root, { childList: true, characterData: true, subtree: true });
    return () => observer.disconnect();
  }, [location.pathname]);
  return null;
}

function SiteLayout() { return <><a className="skip-link" href="#main-content">Skip to content</a><Navbar /><Outlet /><Footer /></>; }
const protect = element => <ProtectedRoute>{element}</ProtectedRoute>;

export default function App() {
  return <BrowserRouter><AuthProvider><RouteAccessibility /><Routes>
    <Route element={<SiteLayout />}>
      <Route index element={<HomePage />} />
      <Route path="explore" element={<ExplorePage />} />
      <Route path="posts/:slug" element={<PostPage />} />
      <Route path="authors/:id" element={<AuthorPage />} />
      <Route path="about" element={<AboutPage />} />
      <Route path="dashboard" element={protect(<DashboardPage />)} />
      <Route path="my-posts" element={protect(<MyPostsPage />)} />
      <Route path="profile" element={protect(<ProfilePage />)} />
      <Route path="write" element={protect(<CreatePostPage />)} />
      <Route path="edit/:id" element={protect(<EditPostPage />)} />
    </Route>
    <Route path="login" element={<LoginPage />} />
    <Route path="register" element={<RegisterPage />} />
    <Route path="404" element={<NotFoundPage />} />
    <Route path="*" element={<NotFoundPage />} />
  </Routes></AuthProvider></BrowserRouter>;
}
