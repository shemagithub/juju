import React, { useState } from "react";
import { Container, Row, Col, Form, Button, Accordion } from "react-bootstrap";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import Lightroom from "react-lightbox-gallery";
import "./services.css";
import { useSiteSettings } from "../../context/SiteSettingsContext";
import { DEFAULT_SITE_SETTINGS } from "../../config/defaultSiteSettings";
import { companyWhatsAppHref } from "../../utils/contentValidation";
import { fetchJson } from "../../utils/backendApi";
import BookingFeedbackModal from "../../components/BookingFeedback/BookingFeedbackModal";

const Services = () => {
  const { settings } = useSiteSettings();
  const whatsappLink = companyWhatsAppHref(settings, DEFAULT_SITE_SETTINGS);
  const [selectedDate, setSelectedDate] = useState(null);
  const [numberOfPeople, setNumberOfPeople] = useState(1);
  const [bookingForm, setBookingForm] = useState({
    name: "",
    email: "",
    phone: "",
    pickupLocation: "",
    message: "",
  });
  const [bookingSubmitting, setBookingSubmitting] = useState(false);
  const [bookingFeedback, setBookingFeedback] = useState({
    show: false,
    variant: "success",
    title: "",
    message: "",
    reference: "",
  });

  const images = [
    {
      src: require("../../assets/images/tour/bali-1.png"),
      desc: "Lake Kivu Beach",
      sub: "Gisenyi, Rwanda",
    },
    {
      src: require("../../assets/images/tour/bangkok.png"),
      desc: "Musanze City Tour",
      sub: "Musanze, Rwanda",
    },
    {
      src: require("../../assets/images/tour/cancun.png"),
      desc: "Volcanoes National Park",
      sub: "Musanze, Rwanda",
    },
    {
      src: require("../../assets/images/tour/malaysia.png"),
      desc: "Akagera Safari Adventure",
      sub: "Akagera, Rwanda",
    },
    {
      src: require("../../assets/images/tour/paris.png"),
      desc: "Kigali City Experience",
      sub: "Kigali, Rwanda",
    },
    {
      src: require("../../assets/images/tour/phuket.png"),
      desc: "Nyungwe Forest",
      sub: "Nyungwe, Rwanda",
    },
  ];

  const gallerySettings = {
    columnCount: {
      default: 3,
      mobile: 2,
      tab: 3,
    },
    mode: "dark",
    enableZoom: false,
  };

  const reviews = [
    {
      name: "John Doe",
      rating: 5,
      comment: "Amazing experience! The tour guide was knowledgeable and friendly.",
      date: "2024-01-15",
    },
    {
      name: "Jane Smith",
      rating: 5,
      comment: "Best travel service I've ever used. Highly recommended!",
      date: "2024-01-20",
    },
    {
      name: "Mike Johnson",
      rating: 4,
      comment: "Great service, beautiful destinations. Will book again!",
      date: "2024-02-01",
    },
  ];

  const faqs = [
    {
      question: "What is included in the tour package?",
      answer:
        "Our tour package includes accommodation, meals, transportation, tour guide, and entrance fees to all attractions mentioned in the itinerary.",
    },
    {
      question: "What is your cancellation policy?",
      answer:
        "You can cancel your booking up to 7 days before the tour date for a full refund. Cancellations within 7 days will incur a 50% charge.",
    },
    {
      question: "Do you provide airport transfers?",
      answer:
        "Yes, airport transfers are included in our tour packages. We offer both arrival and departure transfers.",
    },
    {
      question: "What payment methods do you accept?",
      answer:
        "We accept all major credit cards, PayPal, bank transfers, and mobile money payments.",
    },
    {
      question: "Are there age restrictions?",
      answer:
        "Most of our tours are suitable for all ages. However, some adventure activities may have age restrictions which will be clearly mentioned in the tour details.",
    },
  ];

  const handleBookingSubmit = async (e) => {
    e.preventDefault();
    if (!bookingForm.name.trim() || !bookingForm.email.trim()) {
      setBookingFeedback({
        show: true,
        variant: "error",
        title: "Contact details required",
        message: "Please enter your name and email.",
        reference: "",
      });
      return;
    }
    const reference = `SRV-${Date.now().toString().slice(-8).toUpperCase()}`;
    setBookingSubmitting(true);
    try {
      await fetchJson("/api/tour-booking-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reference,
          name: bookingForm.name.trim(),
          email: bookingForm.email.trim(),
          phone: bookingForm.phone.trim(),
          serviceType: "services",
          travelDate: selectedDate ? selectedDate.toISOString().slice(0, 10) : null,
          adults: numberOfPeople,
          children: 0,
          details: {
            pickupLocation: bookingForm.pickupLocation,
            message: bookingForm.message,
          },
        }),
      });
      setBookingForm({
        name: "",
        email: "",
        phone: "",
        pickupLocation: "",
        message: "",
      });
      setSelectedDate(null);
      setNumberOfPeople(1);
      setBookingFeedback({
        show: true,
        variant: "success",
        title: "Booking submitted!",
        message: "We'll contact you soon to confirm your service booking.",
        reference,
      });
    } catch (err) {
      setBookingFeedback({
        show: true,
        variant: "error",
        title: "Could not submit booking",
        message: err.message || "Please try again or contact us.",
        reference: "",
      });
    } finally {
      setBookingSubmitting(false);
    }
  };

  const handleInputChange = (e) => {
    setBookingForm({
      ...bookingForm,
      [e.target.name]: e.target.value,
    });
  };

  const renderStars = (rating) => {
    return [...Array(5)].map((_, i) => (
      <i
        key={i}
        className={`bi ${i < rating ? "bi-star-fill" : "bi-star"}`}
        style={{ color: i < rating ? "#ffc107" : "#ddd" }}
      ></i>
    ));
  };

  return (
    <div className="services-page">
      {/* 1. Service Hero Section */}
      <section className="service-hero">
        <div className="hero-overlay"></div>
        <Container>
          <Row>
            <Col md="12">
              <div className="hero-content">
                <h1 className="hero-title">Professional Tour & Travel Services</h1>
                <p className="hero-description">
                  Experience the world with our expertly crafted tours. From wildlife
                  safaris to city adventures, we offer unforgettable journeys tailored
                  to your dreams.
                </p>
                <div className="hero-buttons">
                  <a href="#booking" className="primaryBtn">
                    Book Now
                  </a>
                  <a
                    href={whatsappLink || "#"}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="whatsapp-btn"
                    aria-disabled={!whatsappLink}
                    onClick={(e) => !whatsappLink && e.preventDefault()}
                  >
                    <i className="bi bi-whatsapp"></i> WhatsApp Us
                  </a>
                </div>
              </div>
            </Col>
          </Row>
        </Container>
      </section>

      {/* 2. Service Overview */}
      <section className="service-overview py-5">
        <Container>
          <Row>
            <Col md="12" className="text-center mb-4">
              <h2 className="section-title">Service Overview</h2>
            </Col>
          </Row>
          <Row>
            <Col md="3" sm="6" className="mb-4">
              <div className="overview-item">
                <i className="bi bi-check-circle"></i>
                <h4>What's Included</h4>
                <ul>
                  <li>Accommodation</li>
                  <li>Meals (Breakfast, Lunch, Dinner)</li>
                  <li>Transportation</li>
                  <li>Professional Tour Guide</li>
                  <li>Entrance Fees</li>
                </ul>
              </div>
            </Col>
            <Col md="3" sm="6" className="mb-4">
              <div className="overview-item">
                <i className="bi bi-people"></i>
                <h4>Who It's For</h4>
                <ul>
                  <li>Families</li>
                  <li>Couples</li>
                  <li>Solo Travelers</li>
                  <li>Groups</li>
                  <li>Business Travelers</li>
                </ul>
              </div>
            </Col>
            <Col md="3" sm="6" className="mb-4">
              <div className="overview-item">
                <i className="bi bi-clock"></i>
                <h4>Duration</h4>
                <ul>
                  <li>Half Day (4-5 hours)</li>
                  <li>Full Day (8-10 hours)</li>
                  <li>2-3 Day Packages</li>
                  <li>Week Long Tours</li>
                  <li>Custom Duration Available</li>
                </ul>
              </div>
            </Col>
            <Col md="3" sm="6" className="mb-4">
              <div className="overview-item">
                <i className="bi bi-geo-alt"></i>
                <h4>Locations</h4>
                <ul>
                  <li>Wildlife Parks</li>
                  <li>City Tours</li>
                  <li>Beach Destinations</li>
                  <li>Mountain Regions</li>
                  <li>Historical Sites</li>
                </ul>
              </div>
            </Col>
          </Row>
        </Container>
      </section>

      {/* 3. Detailed Description */}
      <section className="service-details py-5 bg-light">
        <Container>
          <Row>
            <Col md="12">
              <h2 className="section-title mb-4">Detailed Description</h2>
            </Col>
            <Col md="8">
              <div className="details-content">
                <h3>What to Expect</h3>
                <p>
                  Our professional tour and travel services provide you with an
                  unforgettable experience. From the moment you book with us, we ensure
                  every detail is taken care of.
                </p>
                <h4>Step-by-Step Process</h4>
                <ol>
                  <li>
                    <strong>Booking:</strong> Contact us or use our online booking form
                  </li>
                  <li>
                    <strong>Confirmation:</strong> Receive instant confirmation via email
                    or SMS
                  </li>
                  <li>
                    <strong>Pre-tour Briefing:</strong> Get all necessary information
                    before your tour
                  </li>
                  <li>
                    <strong>Tour Experience:</strong> Enjoy your journey with our expert
                    guides
                  </li>
                  <li>
                    <strong>Post-tour Support:</strong> We're here for any follow-up
                    questions
                  </li>
                </ol>
                <h4>Rules & Requirements</h4>
                <ul>
                  <li>Valid identification required for all participants</li>
                  <li>Minimum age restrictions may apply for certain activities</li>
                  <li>Fitness requirements for adventure tours</li>
                  <li>Special permits may be required (e.g., Gorilla Permits)</li>
                  <li>Follow park regulations and guidelines</li>
                  <li>Respect local culture and environment</li>
                </ul>
              </div>
            </Col>
            <Col md="4">
              <div className="requirements-box">
                <h4>Important Information</h4>
                <div className="info-item">
                  <i className="bi bi-calendar-check"></i>
                  <span>Book in advance for peak seasons</span>
                </div>
                <div className="info-item">
                  <i className="bi bi-shield-check"></i>
                  <span>All tours are insured</span>
                </div>
                <div className="info-item">
                  <i className="bi bi-award"></i>
                  <span>Licensed tour operator</span>
                </div>
                <div className="info-item">
                  <i className="bi bi-credit-card"></i>
                  <span>Secure payment processing</span>
                </div>
              </div>
            </Col>
          </Row>
        </Container>
      </section>

      {/* 4. Pricing Section */}
      <section className="pricing-section py-5">
        <Container>
          <Row>
            <Col md="12" className="text-center mb-5">
              <h2 className="section-title">Pricing & Packages</h2>
            </Col>
          </Row>
          <Row>
            <Col md="4" className="mb-4">
              <div className="pricing-card">
                <h3>Basic Package</h3>
                <div className="price">
                  <span className="currency">$</span>
                  <span className="amount">299</span>
                  <span className="period">/person</span>
                </div>
                <ul className="price-features">
                  <li>
                    <i className="bi bi-check"></i> 1 Day Tour
                  </li>
                  <li>
                    <i className="bi bi-check"></i> Transportation
                  </li>
                  <li>
                    <i className="bi bi-check"></i> Guide Service
                  </li>
                  <li>
                    <i className="bi bi-check"></i> Lunch Included
                  </li>
                  <li>
                    <i className="bi bi-x"></i> Accommodation
                  </li>
                  <li>
                    <i className="bi bi-x"></i> Dinner
                  </li>
                </ul>
                <Button className="primaryBtn w-100">Select Package</Button>
              </div>
            </Col>
            <Col md="4" className="mb-4">
              <div className="pricing-card featured">
                <div className="badge">Popular</div>
                <h3>Standard Package</h3>
                <div className="price">
                  <span className="currency">$</span>
                  <span className="amount">599</span>
                  <span className="period">/person</span>
                </div>
                <ul className="price-features">
                  <li>
                    <i className="bi bi-check"></i> 3 Day Tour
                  </li>
                  <li>
                    <i className="bi bi-check"></i> Accommodation (2 nights)
                  </li>
                  <li>
                    <i className="bi bi-check"></i> All Meals
                  </li>
                  <li>
                    <i className="bi bi-check"></i> Transportation
                  </li>
                  <li>
                    <i className="bi bi-check"></i> Guide Service
                  </li>
                  <li>
                    <i className="bi bi-check"></i> Entrance Fees
                  </li>
                </ul>
                <Button className="primaryBtn w-100">Select Package</Button>
              </div>
            </Col>
            <Col md="4" className="mb-4">
              <div className="pricing-card">
                <h3>Premium Package</h3>
                <div className="price">
                  <span className="currency">$</span>
                  <span className="amount">999</span>
                  <span className="period">/person</span>
                </div>
                <ul className="price-features">
                  <li>
                    <i className="bi bi-check"></i> 5 Day Tour
                  </li>
                  <li>
                    <i className="bi bi-check"></i> Luxury Accommodation
                  </li>
                  <li>
                    <i className="bi bi-check"></i> All Meals
                  </li>
                  <li>
                    <i className="bi bi-check"></i> Private Transportation
                  </li>
                  <li>
                    <i className="bi bi-check"></i> Professional Guide
                  </li>
                  <li>
                    <i className="bi bi-check"></i> All Activities Included
                  </li>
                </ul>
                <Button className="primaryBtn w-100">Select Package</Button>
              </div>
            </Col>
          </Row>
          <Row className="mt-4">
            <Col md="6">
              <div className="includes-excludes">
                <h4>What's Included:</h4>
                <ul>
                  <li>All transportation during the tour</li>
                  <li>Accommodation (as per package)</li>
                  <li>Meals (as specified)</li>
                  <li>Professional tour guide</li>
                  <li>All entrance fees</li>
                </ul>
              </div>
            </Col>
            <Col md="6">
              <div className="includes-excludes">
                <h4>What's Excluded:</h4>
                <ul>
                  <li>International flights</li>
                  <li>Travel insurance</li>
                  <li>Personal expenses</li>
                  <li>Tips and gratuities</li>
                  <li>Optional activities</li>
                </ul>
              </div>
            </Col>
          </Row>
        </Container>
      </section>

      {/* 5. Availability & Booking */}
      <section id="booking" className="booking-section py-5 bg-light">
        <Container>
          <Row>
            <Col md="12" className="text-center mb-4">
              <h2 className="section-title">Book Your Tour</h2>
              <p>Fill out the form below to reserve your spot</p>
            </Col>
          </Row>
          <Row>
            <Col md="8" className="mx-auto">
              <Form onSubmit={handleBookingSubmit} className="booking-form">
                <Row>
                  <Col md="6" className="mb-3">
                    <Form.Label>Full Name *</Form.Label>
                    <Form.Control
                      type="text"
                      name="name"
                      value={bookingForm.name}
                      onChange={handleInputChange}
                      required
                    />
                  </Col>
                  <Col md="6" className="mb-3">
                    <Form.Label>Email Address *</Form.Label>
                    <Form.Control
                      type="email"
                      name="email"
                      value={bookingForm.email}
                      onChange={handleInputChange}
                      required
                    />
                  </Col>
                  <Col md="6" className="mb-3">
                    <Form.Label>Phone Number *</Form.Label>
                    <Form.Control
                      type="tel"
                      name="phone"
                      value={bookingForm.phone}
                      onChange={handleInputChange}
                      required
                    />
                  </Col>
                  <Col md="6" className="mb-3">
                    <Form.Label>Tour Date *</Form.Label>
                    <DatePicker
                      selected={selectedDate}
                      onChange={(date) => setSelectedDate(date)}
                      minDate={new Date()}
                      className="form-control"
                      dateFormat="MM/dd/yyyy"
                      placeholderText="Select date"
                      required
                    />
                  </Col>
                  <Col md="6" className="mb-3">
                    <Form.Label>Number of People *</Form.Label>
                    <Form.Select
                      value={numberOfPeople}
                      onChange={(e) => setNumberOfPeople(e.target.value)}
                      required
                    >
                      {[...Array(20)].map((_, i) => (
                        <option key={i + 1} value={i + 1}>
                          {i + 1} {i === 0 ? "Person" : "People"}
                        </option>
                      ))}
                    </Form.Select>
                  </Col>
                  <Col md="6" className="mb-3">
                    <Form.Label>Pickup Location</Form.Label>
                    <Form.Control
                      type="text"
                      name="pickupLocation"
                      value={bookingForm.pickupLocation}
                      onChange={handleInputChange}
                      placeholder="Airport / Hotel / Address"
                    />
                  </Col>
                  <Col md="12" className="mb-3">
                    <Form.Label>Additional Message</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={4}
                      name="message"
                      value={bookingForm.message}
                      onChange={handleInputChange}
                      placeholder="Any special requirements or questions..."
                    />
                  </Col>
                  <Col md="12" className="text-center">
                    <Button type="submit" className="primaryBtn" disabled={bookingSubmitting}>
                      {bookingSubmitting ? "Submitting…" : "Submit Booking Request"}
                    </Button>
                    <p className="mt-3 text-muted">
                      <i className="bi bi-shield-check"></i> Secure booking • Instant
                      confirmation
                    </p>
                  </Col>
                </Row>
              </Form>
            </Col>
          </Row>
        </Container>
      </section>

      {/* 6. Image Gallery */}
      <section className="service-gallery py-5">
        <Container>
          <Row>
            <Col md="12" className="text-center mb-4">
              <h2 className="section-title">Photo Gallery</h2>
              <p>Explore our beautiful destinations</p>
            </Col>
          </Row>
          <Row>
            <Col md="12">
              <Lightroom images={images} settings={gallerySettings} />
            </Col>
          </Row>
        </Container>
      </section>

      {/* 7. Itinerary / Process */}
      <section className="itinerary-section py-5 bg-light">
        <Container>
          <Row>
            <Col md="12" className="mb-4">
              <h2 className="section-title">Tour Itinerary</h2>
            </Col>
            <Col md="12">
              <div className="itinerary-timeline">
                <div className="timeline-item">
                  <div className="timeline-icon">
                    <i className="bi bi-airplane"></i>
                  </div>
                  <div className="timeline-content">
                    <h4>Day 1: Arrival & Briefing</h4>
                    <p>
                      Arrive at the destination, meet your guide, and attend a
                      comprehensive briefing session. Check into your accommodation and
                      enjoy a welcome dinner.
                    </p>
                  </div>
                </div>
                <div className="timeline-item">
                  <div className="timeline-icon">
                    <i className="bi bi-tree"></i>
                  </div>
                  <div className="timeline-content">
                    <h4>Day 2: Wildlife Safari / Gorilla Trekking 🦍</h4>
                    <p>
                      Early morning start for wildlife viewing or gorilla trekking
                      experience. Witness amazing wildlife in their natural habitat with
                      experienced guides.
                    </p>
                  </div>
                </div>
                <div className="timeline-item">
                  <div className="timeline-icon">
                    <i className="bi bi-building"></i>
                  </div>
                  <div className="timeline-content">
                    <h4>Day 3: City Tour & Cultural Experience</h4>
                    <p>
                      Explore the local city, visit cultural sites, markets, and
                      historical landmarks. Interact with locals and experience authentic
                      culture.
                    </p>
                  </div>
                </div>
              </div>
            </Col>
          </Row>
        </Container>
      </section>

      {/* 8. Map & Location */}
      <section className="map-section py-5">
        <Container>
          <Row>
            <Col md="12" className="text-center mb-4">
              <h2 className="section-title">Location & Pickup Points</h2>
            </Col>
            <Col md="12">
              <div className="map-container">
                <iframe
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3987.477678563839!2d30.088936314753593!3d-1.9447379985734525!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x19dca4258ed8f6b3%3A0x6e8a1b5a0c9e5c1d!2sKigali%2C%20Rwanda!5e0!3m2!1sen!2s!4v1234567890"
                  width="100%"
                  height="450"
                  style={{ border: 0 }}
                  allowFullScreen=""
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title="Tour Location Map"
                ></iframe>
              </div>
              <div className="location-info mt-4">
                <Row>
                  <Col md="4" className="mb-3">
                    <h5>
                      <i className="bi bi-geo-alt"></i> Main Office
                    </h5>
                    <p>KG 123 St, Kigali, Rwanda</p>
                  </Col>
                  <Col md="4" className="mb-3">
                    <h5>
                      <i className="bi bi-airplane"></i> Airport Pickup
                    </h5>
                    <p>Available 24/7 at all major airports</p>
                  </Col>
                  <Col md="4" className="mb-3">
                    <h5>
                      <i className="bi bi-building"></i> Hotel Pickup
                    </h5>
                    <p>Pickup available from most hotels</p>
                  </Col>
                </Row>
              </div>
            </Col>
          </Row>
        </Container>
      </section>

      {/* 9. Reviews & Testimonials */}
      <section className="reviews-section py-5 bg-light">
        <Container>
          <Row>
            <Col md="12" className="text-center mb-5">
              <h2 className="section-title">Customer Reviews</h2>
              <p>What our customers say about us</p>
            </Col>
          </Row>
          <Row>
            {reviews.map((review, index) => (
              <Col md="4" key={index} className="mb-4">
                <div className="review-card">
                  <div className="review-header">
                    <div className="reviewer-name">{review.name}</div>
                    <div className="review-rating">{renderStars(review.rating)}</div>
                  </div>
                  <p className="review-comment">{review.comment}</p>
                  <div className="review-date">{review.date}</div>
                </div>
              </Col>
            ))}
          </Row>
          <Row className="mt-4">
            <Col md="12" className="text-center">
              <div className="trust-badges">
                <div className="badge-item">
                  <i className="bi bi-shield-check"></i>
                  <span>Licensed Operator</span>
                </div>
                <div className="badge-item">
                  <i className="bi bi-award"></i>
                  <span>5-Star Rated</span>
                </div>
                <div className="badge-item">
                  <i className="bi bi-people"></i>
                  <span>10,000+ Happy Customers</span>
                </div>
                <div className="badge-item">
                  <i className="bi bi-lock"></i>
                  <span>SSL Secured Payments</span>
                </div>
              </div>
            </Col>
          </Row>
        </Container>
      </section>

      {/* 10. FAQ Section */}
      <section className="faq-section py-5">
        <Container>
          <Row>
            <Col md="12" className="text-center mb-4">
              <h2 className="section-title">Frequently Asked Questions</h2>
            </Col>
            <Col md="10" className="mx-auto">
              <Accordion defaultActiveKey="0">
                {faqs.map((faq, index) => (
                  <Accordion.Item eventKey={index.toString()} key={index}>
                    <Accordion.Header>{faq.question}</Accordion.Header>
                    <Accordion.Body>{faq.answer}</Accordion.Body>
                  </Accordion.Item>
                ))}
              </Accordion>
            </Col>
          </Row>
        </Container>
      </section>

      {/* 11. Call-to-Action (CTA) */}
      <section className="cta-section py-5">
        <div className="cta-overlay"></div>
        <Container>
          <Row>
            <Col md="12" className="text-center">
              <h2 className="cta-title">Ready to Start Your Adventure?</h2>
              <p className="cta-description">
                Book your tour today and create memories that last a lifetime
              </p>
              <div className="cta-buttons">
                <a href="#booking" className="primaryBtn me-3">
                  Book Now
                </a>
                <a
                  href="mailto:info@travelcompany.com"
                  className="secondary_btn"
                >
                  Request a Quote
                </a>
              </div>
            </Col>
          </Row>
        </Container>
      </section>

      <BookingFeedbackModal
        show={bookingFeedback.show}
        onHide={() => setBookingFeedback((prev) => ({ ...prev, show: false }))}
        variant={bookingFeedback.variant}
        title={bookingFeedback.title}
        message={bookingFeedback.message}
        reference={bookingFeedback.reference}
        showContactLink={bookingFeedback.variant === "error"}
      />
    </div>
  );
};

export default Services;
