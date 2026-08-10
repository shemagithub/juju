import React, { useState } from "react";
import {
  Container,
  Row,
  Col,
  Form,
  Button,
  Card,
  Accordion,
  Badge,
  InputGroup,
  Spinner,
} from "react-bootstrap";
import { NavLink } from "react-router-dom";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import "./contact.css";
import { fetchJson, resolveMediaUrl } from "../../utils/backendApi";
import { useSiteSettings } from "../../context/SiteSettingsContext";
import { DEFAULT_SITE_SETTINGS } from "../../config/defaultSiteSettings";
import { companyWhatsAppHref, phoneHref } from "../../utils/contentValidation";

const INITIAL_FORM = {
  name: "",
  email: "",
  phone: "",
  country: "",
  subject: "",
  message: "",
  contactMethod: "email",
  travelDate: null,
  travelers: "",
};

const Contact = () => {
  const { settings } = useSiteSettings();
  const brandName = settings.brandName || DEFAULT_SITE_SETTINGS.brandName;
  const logoUrl = resolveMediaUrl(settings.logoUrl || "");
  const companyDescription =
    settings.companyDescription ||
    settings.footerDescription ||
    DEFAULT_SITE_SETTINGS.companyDescription ||
    DEFAULT_SITE_SETTINGS.footerDescription;
  const contactPhone = settings.contactPhone || DEFAULT_SITE_SETTINGS.contactPhone;
  const contactEmail = settings.contactEmail || DEFAULT_SITE_SETTINGS.contactEmail;
  const whatsappLink = companyWhatsAppHref(settings, DEFAULT_SITE_SETTINGS);
  const phoneLink = phoneHref(contactPhone);
  const address = settings.address || DEFAULT_SITE_SETTINGS.address;
  const workingHours = settings.workingHours || DEFAULT_SITE_SETTINGS.workingHours || "Monday – Sunday: 8:00 AM – 6:00 PM";
  const emergencyPhone = settings.emergencyPhone || DEFAULT_SITE_SETTINGS.emergencyPhone;
  const facebook = settings.facebook || DEFAULT_SITE_SETTINGS.facebook;
  const instagram = settings.instagram || DEFAULT_SITE_SETTINGS.instagram;
  const twitter = settings.twitter || DEFAULT_SITE_SETTINGS.twitter;
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [selectedInquiry, setSelectedInquiry] = useState(null);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (submitError) setSubmitError("");
  };

  const handleInquiryShortcut = (inquiryType, subject) => {
    setSelectedInquiry(inquiryType);
    setFormData((prev) => ({ ...prev, subject }));
    document.getElementById("contact-form")?.scrollIntoView({ behavior: "smooth" });
  };

  const buildMessageBody = () => {
    const lines = [
      formData.phone && `Phone: +250 ${formData.phone}`,
      formData.country && `Country: ${formData.country}`,
      formData.travelDate && `Travel date: ${formData.travelDate.toLocaleDateString()}`,
      formData.travelers && `Travelers: ${formData.travelers}`,
      `Preferred contact: ${formData.contactMethod}`,
      selectedInquiry && `Quick inquiry: ${inquiryShortcuts.find((s) => s.id === selectedInquiry)?.title}`,
      "",
      formData.message,
    ].filter(Boolean);
    return lines.join("\n");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setSubmitError("");

    try {
      await fetchJson("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          source: "contact-form",
          name: formData.name,
          email: formData.email,
          subject: formData.subject,
          body: buildMessageBody(),
        }),
      });
      setSubmitted(true);
      setFormData(INITIAL_FORM);
      setSelectedInquiry(null);
      setTimeout(() => setSubmitted(false), 5000);
    } catch (err) {
      setSubmitError(
        err.message || "Something went wrong. Please try again or contact us via WhatsApp.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const inquiryShortcuts = [
    {
      id: "gorilla",
      title: "Book Gorilla Permit",
      icon: "🦍",
      description: "Get help securing your gorilla trekking permit",
      subject: "Gorilla Trekking",
    },
    {
      id: "safari",
      title: "Request Safari Quote",
      icon: "🦁",
      description: "Get a customized quote for wildlife safari",
      subject: "Safari Packages",
    },
    {
      id: "transfer",
      title: "Airport Transfer",
      icon: "🚗",
      description: "Book airport pickup and drop-off service",
      subject: "Car Hire",
    },
    {
      id: "hotel",
      title: "Hotel Booking",
      icon: "🏨",
      description: "Find the perfect accommodation for your stay",
      subject: "Hotel Booking",
    },
  ];

  const faqs = [
    {
      question: "How fast do you respond to inquiries?",
      answer:
        "We typically respond within 2–4 hours during business hours (8 AM – 6 PM Kigali time). For urgent inquiries, WhatsApp is the fastest way to reach us.",
    },
    {
      question: "Do you help with gorilla permits?",
      answer:
        "Yes! We specialize in securing gorilla trekking permits. Contact us as early as possible — permits sell out quickly.",
    },
    {
      question: "What payment methods do you accept?",
      answer:
        "We accept major credit cards, bank transfers, mobile money (MTN, Airtel), and PayPal.",
    },
    {
      question: "Can I contact you on WhatsApp?",
      answer: `Absolutely! Reach us at ${contactPhone}. We respond quickly via WhatsApp during business hours.`,
    },
    {
      question: "What are your working hours?",
      answer:
        "Monday – Sunday, 8:00 AM – 6:00 PM (Kigali time). 24/7 emergency support for clients on tour.",
    },
    {
      question: "Do you offer airport transfers?",
      answer:
        "Yes, we provide 24/7 airport transfer services from Kigali International Airport.",
    },
  ];

  return (
    <div className="contact-page">
      <section className="contact-hero">
        <div className="hero-overlay"></div>
        <Container>
          <Row>
            <Col md="12" className="text-center">
              <span className="contact-hero-label">Get in Touch</span>
              <h1 className="contact-hero-title">
                <span className="contact-title-script">Contact</span>
                <span className="contact-title-bold">{brandName}</span>
              </h1>
              {logoUrl ? (
                <div className="contact-brand-logo mb-3">
                  <img
                    src={logoUrl}
                    alt={brandName}
                    className="site-brand-logo-img brand-logo-transparent"
                  />
                </div>
              ) : null}
              <p className="hero-description">
                {companyDescription ||
                  "Get in touch with our Rwanda travel experts. We respond fast and are here to help you plan your perfect adventure."}
              </p>
            </Col>
          </Row>
        </Container>
      </section>

      <section className="inquiry-shortcuts py-5">
        <Container>
          <Row>
            <Col md="12" className="mb-4 text-center">
              <h2 className="contact-section-title">
                <span className="contact-title-script">Quick</span>
                <span className="contact-title-bold">Inquiry Options</span>
              </h2>
              <p className="section-subtitle">
                Choose the type of inquiry to get started faster
              </p>
            </Col>
          </Row>
          <Row>
            {inquiryShortcuts.map((shortcut) => (
              <Col md="3" sm="6" key={shortcut.id} className="mb-4">
                <Card
                  className={`inquiry-card ${selectedInquiry === shortcut.id ? "selected" : ""}`}
                  onClick={() => handleInquiryShortcut(shortcut.id, shortcut.subject)}
                >
                  <Card.Body className="text-center">
                    <div className="inquiry-icon">{shortcut.icon}</div>
                    <h5>{shortcut.title}</h5>
                    <p className="inquiry-description">{shortcut.description}</p>
                    <Button variant="outline-primary" size="sm" className="inquiry-btn w-100">
                      Get Started
                    </Button>
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>
        </Container>
      </section>

      <section className="contact-main py-5">
        <Container>
          <Row>
            <Col lg="7" className="mb-5 mb-lg-0">
              <div id="contact-form" className="contact-form-card">
                <h2 className="contact-section-title mb-4">
                  <span className="contact-title-script">Send</span>
                  <span className="contact-title-bold">Us a Message</span>
                </h2>

                {submitted && (
                  <div className="contact-alert success" role="alert">
                    <i className="bi bi-check-circle-fill"></i>
                    Thank you! Your message has been sent. We&apos;ll contact you soon.
                  </div>
                )}
                {submitError && (
                  <div className="contact-alert error" role="alert">
                    <i className="bi bi-exclamation-triangle-fill"></i>
                    {submitError}
                  </div>
                )}

                <Form onSubmit={handleSubmit}>
                  <Row>
                    <Col md="6" className="mb-3">
                      <Form.Label>
                        Full Name <span className="text-danger">*</span>
                      </Form.Label>
                      <Form.Control
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        required
                        placeholder="Enter your full name"
                        disabled={submitting}
                      />
                    </Col>
                    <Col md="6" className="mb-3">
                      <Form.Label>
                        Email Address <span className="text-danger">*</span>
                      </Form.Label>
                      <Form.Control
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        required
                        placeholder="your.email@example.com"
                        disabled={submitting}
                      />
                    </Col>
                    <Col md="6" className="mb-3">
                      <Form.Label>
                        Phone / WhatsApp <span className="text-danger">*</span>
                      </Form.Label>
                      <InputGroup>
                        <InputGroup.Text>+250</InputGroup.Text>
                        <Form.Control
                          type="tel"
                          name="phone"
                          value={formData.phone}
                          onChange={handleInputChange}
                          required
                          placeholder="799 608 178"
                          disabled={submitting}
                        />
                      </InputGroup>
                    </Col>
                    <Col md="6" className="mb-3">
                      <Form.Label>Country</Form.Label>
                      <Form.Select
                        name="country"
                        value={formData.country}
                        onChange={handleInputChange}
                        disabled={submitting}
                      >
                        <option value="">Select your country</option>
                        <option value="Rwanda">Rwanda</option>
                        <option value="USA">United States</option>
                        <option value="UK">United Kingdom</option>
                        <option value="Canada">Canada</option>
                        <option value="Singapore">Singapore</option>
                        <option value="Other">Other</option>
                      </Form.Select>
                    </Col>
                    <Col md="6" className="mb-3">
                      <Form.Label>
                        Subject <span className="text-danger">*</span>
                      </Form.Label>
                      <Form.Select
                        name="subject"
                        value={formData.subject}
                        onChange={handleInputChange}
                        required
                        disabled={submitting}
                      >
                        <option value="">Select a subject</option>
                        <option value="Gorilla Trekking">Gorilla Trekking</option>
                        <option value="Safari Packages">Safari Packages</option>
                        <option value="Car Hire">Car Hire</option>
                        <option value="Airport Transfer">Airport Transfer</option>
                        <option value="Hotel Booking">Hotel Booking</option>
                        <option value="Custom Tour">Custom Tour</option>
                        <option value="General Inquiry">General Inquiry</option>
                      </Form.Select>
                    </Col>
                    <Col md="6" className="mb-3">
                      <Form.Label>Preferred Contact Method</Form.Label>
                      <Form.Select
                        name="contactMethod"
                        value={formData.contactMethod}
                        onChange={handleInputChange}
                        disabled={submitting}
                      >
                        <option value="email">Email</option>
                        <option value="whatsapp">WhatsApp</option>
                        <option value="call">Phone Call</option>
                      </Form.Select>
                    </Col>
                    <Col md="6" className="mb-3">
                      <Form.Label>Travel Date (Optional)</Form.Label>
                      <DatePicker
                        selected={formData.travelDate}
                        onChange={(date) =>
                          setFormData((prev) => ({ ...prev, travelDate: date }))
                        }
                        minDate={new Date()}
                        className="form-control"
                        dateFormat="MM/dd/yyyy"
                        placeholderText="Select travel date"
                        disabled={submitting}
                      />
                    </Col>
                    <Col md="6" className="mb-3">
                      <Form.Label>Number of Travelers (Optional)</Form.Label>
                      <Form.Select
                        name="travelers"
                        value={formData.travelers}
                        onChange={handleInputChange}
                        disabled={submitting}
                      >
                        <option value="">Select number</option>
                        {[...Array(20)].map((_, i) => (
                          <option key={i + 1} value={i + 1}>
                            {i + 1} {i === 0 ? "Person" : "People"}
                          </option>
                        ))}
                      </Form.Select>
                    </Col>
                    <Col md="12" className="mb-3">
                      <Form.Label>
                        Message <span className="text-danger">*</span>
                      </Form.Label>
                      <Form.Control
                        as="textarea"
                        rows={6}
                        name="message"
                        value={formData.message}
                        onChange={handleInputChange}
                        required
                        placeholder="Tell us about your travel plans, questions, or special requirements..."
                        disabled={submitting}
                      />
                    </Col>
                    {selectedInquiry && (
                      <Col md="12" className="mb-3">
                        <div className="inquiry-note">
                          <i className="bi bi-info-circle"></i>
                          <strong>Quick Inquiry:</strong>{" "}
                          {inquiryShortcuts.find((s) => s.id === selectedInquiry)?.title}
                        </div>
                      </Col>
                    )}
                    <Col md="12" className="mb-3">
                      <Button
                        type="submit"
                        className="primaryBtn w-100 contact-submit-btn"
                        size="lg"
                        disabled={submitting}
                      >
                        {submitting ? (
                          <>
                            <Spinner animation="border" size="sm" className="me-2" />
                            Sending…
                          </>
                        ) : (
                          <>
                            <i className="bi bi-send"></i> Send Message
                          </>
                        )}
                      </Button>
                    </Col>
                    <Col md="12">
                      <p className="form-note">
                        <i className="bi bi-shield-check"></i> Your information is secure
                        and will never be shared with third parties.
                      </p>
                    </Col>
                  </Row>
                </Form>
              </div>
            </Col>

            <Col lg="5">
              <div className="contact-info-section">
                <h2 className="contact-section-title mb-4">
                  <span className="contact-title-script">Get</span>
                  <span className="contact-title-bold">in Touch</span>
                </h2>

                <div className="instant-contact mb-4">
                  <h5>Quick Contact</h5>
                  <div className="contact-buttons">
                    <a href={`tel:${contactPhone.replace(/\s/g, "")}`} className="contact-btn call-btn">
                      <i className="bi bi-telephone-fill"></i>
                      <span>Call Now</span>
                    </a>
                    <a
                      href={whatsappLink || "#"}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="contact-btn whatsapp-btn"
                      onClick={(e) => !whatsappLink && e.preventDefault()}
                    >
                      <i className="bi bi-whatsapp"></i>
                      <span>WhatsApp</span>
                    </a>
                    <a href={`mailto:${contactEmail}`} className="contact-btn email-btn">
                      <i className="bi bi-envelope-fill"></i>
                      <span>Email</span>
                    </a>
                  </div>
                </div>

                <div className="office-info mb-4">
                  <h5>Office Information</h5>
                  <div className="info-item">
                    <i className="bi bi-building"></i>
                    <div>
                      <strong>{brandName} Tours</strong>
                      <p>{address}</p>
                    </div>
                  </div>
                  <div className="info-item">
                    <i className="bi bi-telephone"></i>
                    <div>
                      <strong>Phone</strong>
                      <p><a href={`tel:${contactPhone.replace(/\s/g, "")}`}>{contactPhone}</a></p>
                    </div>
                  </div>
                  <div className="info-item">
                    <i className="bi bi-whatsapp"></i>
                    <div>
                      <strong>WhatsApp</strong>
                      <p>
                        <a
                          href={whatsappLink || "#"}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => !whatsappLink && e.preventDefault()}
                        >
                          {contactPhone}
                        </a>
                      </p>
                    </div>
                  </div>
                  <div className="info-item">
                    <i className="bi bi-envelope"></i>
                    <div>
                      <strong>Email</strong>
                      <p><a href={`mailto:${contactEmail}`}>{contactEmail}</a></p>
                    </div>
                  </div>
                  <div className="info-item">
                    <i className="bi bi-clock"></i>
                    <div>
                      <strong>Working Hours</strong>
                      <p>{workingHours}</p>
                      <p className="text-muted">(Kigali Time – GMT+2)</p>
                    </div>
                  </div>
                  <div className="info-item emergency">
                    <i className="bi bi-exclamation-triangle"></i>
                    <div>
                      <strong>Emergency Support</strong>
                      <p>24/7 for clients on tour</p>
                      <p><a href={`tel:${emergencyPhone.replace(/\s/g, "")}`}>{emergencyPhone}</a></p>
                    </div>
                  </div>
                </div>

                <div className="social-media mb-4">
                  <h5>Follow Us</h5>
                  <div className="social-links">
                    {facebook ? (
                      <a href={facebook} target="_blank" rel="noopener noreferrer" className="social-link" title="Facebook">
                        <i className="bi bi-facebook"></i>
                      </a>
                    ) : null}
                    {instagram ? (
                      <a href={instagram} target="_blank" rel="noopener noreferrer" className="social-link" title="Instagram">
                        <i className="bi bi-instagram"></i>
                      </a>
                    ) : null}
                    {twitter ? (
                      <a href={twitter} target="_blank" rel="noopener noreferrer" className="social-link" title="Twitter">
                        <i className="bi bi-twitter"></i>
                      </a>
                    ) : null}
                  </div>
                </div>
              </div>
            </Col>
          </Row>
        </Container>
      </section>

      <section className="map-section py-5">
        <Container>
          <Row>
            <Col md="12" className="mb-4 text-center">
              <h2 className="contact-section-title">
                <span className="contact-title-script">Find</span>
                <span className="contact-title-bold">Our Office</span>
              </h2>
              <p className="section-subtitle">Visit us in Kigali, Rwanda</p>
            </Col>
            <Col md="12">
              <div className="map-container">
                <iframe
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3987.477678563839!2d30.088936314753593!3d-1.9447379985734525!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x19dca4258ed8f6b3%3A0x6e8a1b5a0c9e5c1d!2sKigali%2C%20Rwanda!5e0!3m2!1sen!2s!4v1234567890"
                  width="100%"
                  height="450"
                  style={{ border: 0, borderRadius: "10px" }}
                  allowFullScreen=""
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title="RwandaQuest Office Location"
                ></iframe>
              </div>
              <div className="map-actions text-center mt-3">
                <a
                  href="https://www.google.com/maps/dir//Kigali,+Rwanda"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="primaryBtn me-3"
                >
                  <i className="bi bi-geo-alt"></i> Get Directions
                </a>
                <Badge className="map-badge">
                  <i className="bi bi-info-circle"></i> {address}
                </Badge>
              </div>
            </Col>
          </Row>
        </Container>
      </section>

      <section className="contact-faqs py-5">
        <Container>
          <Row>
            <Col md="12" className="mb-4 text-center">
              <h2 className="contact-section-title">
                <span className="contact-title-script">Frequently</span>
                <span className="contact-title-bold">Asked Questions</span>
              </h2>
              <p className="section-subtitle">Quick answers to common contact questions</p>
            </Col>
            <Col md="10" className="mx-auto">
              <Accordion>
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

      <section className="contact-cta py-5">
        <div className="cta-overlay"></div>
        <Container>
          <Row>
            <Col md="12" className="text-center">
              <h2 className="cta-title">Ready to Start Your Rwanda Adventure?</h2>
              <p className="cta-description">
                Let our expert team help you plan an unforgettable experience
              </p>
              <div className="cta-buttons">
                <Button className="primaryBtn me-3" as={NavLink} to="/packages">
                  Plan Your Trip
                </Button>
                <a
                  href={whatsappLink || "#"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="cta-whatsapp-btn me-3"
                  onClick={(e) => !whatsappLink && e.preventDefault()}
                >
                  <i className="bi bi-whatsapp"></i> Chat on WhatsApp
                </a>
                <Button variant="outline-light" as={NavLink} to="/contact">
                  Request Custom Tour
                </Button>
              </div>
            </Col>
          </Row>
        </Container>
      </section>

      <div className="sticky-contact-buttons">
        <a href={phoneLink || "#"} className="sticky-btn call-btn" title="Call Us" onClick={(e) => !phoneLink && e.preventDefault()}>
          <i className="bi bi-telephone-fill"></i>
        </a>
      </div>
    </div>
  );
};

export default Contact;
