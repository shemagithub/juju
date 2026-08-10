import { lazy, Suspense } from "react";
import { Route, Routes } from "react-router-dom";
import "./App.css";
import "./styles/pages-theme.css";
import "./styles/responsive.css";
import Header from "./components/Common/Header/Header";
import Footer from "./components/Common/Footer/Footer";
import WhatsAppFloat from "./components/WhatsAppFloat/WhatsAppFloat";
import { SiteSettingsProvider } from "./context/SiteSettingsContext";
import { CurrencyProvider } from "./context/CurrencyContext";
import PageSeo from "./components/Seo/PageSeo";
import ScrollToTop from "./components/Common/ScrollToTop/ScrollToTop";

const Home = lazy(() => import("./pages/Home/Home"));
const Services = lazy(() => import("./pages/Services/Services"));
const About = lazy(() => import("./pages/About/About"));
const Packages = lazy(() => import("./pages/Packages/Packages"));
const Destinations = lazy(() => import("./pages/Destinations/Destinations"));
const Gallery = lazy(() => import("./pages/Gallery/Gallery"));
const Blog = lazy(() => import("./pages/Blog/Blog"));
const BlogDetail = lazy(() => import("./pages/Blog/BlogDetail"));
const Contact = lazy(() => import("./pages/Contact/Contact"));
const Book = lazy(() => import("./pages/Book/Book"));
const CarRental = lazy(() => import("./pages/CarRental/CarRental"));
const CarRentalDetail = lazy(() => import("./pages/CarRental/CarRentalDetail"));
const PrivacyPolicy = lazy(() => import("./pages/Legal/PrivacyPolicy"));
const TermsConditions = lazy(() => import("./pages/Legal/TermsConditions"));

function PageLoader() {
  return (
    <div className="site-page-loader" role="status" aria-live="polite" aria-label="Loading page">
      <div className="site-page-loader__spinner" />
    </div>
  );
}

function App() {
  return (
    <SiteSettingsProvider>
      <CurrencyProvider>
        <PageSeo />
        <ScrollToTop />
        <Header />
        <main className="site-main">
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/services" element={<Services />} />
              <Route path="/car-rental" element={<CarRental />} />
              <Route path="/car-rental/:slug" element={<CarRentalDetail />} />
              <Route path="/about" element={<About />} />
              <Route path="/packages" element={<Packages />} />
              <Route path="/destinations" element={<Destinations />} />
              <Route path="/gallery" element={<Gallery />} />
              <Route path="/blog" element={<Blog />} />
              <Route path="/blog/:id" element={<BlogDetail />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/book" element={<Book />} />
              <Route path="/privacy" element={<PrivacyPolicy />} />
              <Route path="/terms" element={<TermsConditions />} />
            </Routes>
          </Suspense>
        </main>
        <Footer />
        <WhatsAppFloat />
      </CurrencyProvider>
    </SiteSettingsProvider>
  );
}

export default App;
