import React from "react";
import { Modal, Button } from "react-bootstrap";
import { NavLink } from "react-router-dom";
import "./booking-feedback.css";

const VARIANTS = {
  success: {
    icon: "bi-check-circle-fill",
    accent: "booking-feedback--success",
  },
  error: {
    icon: "bi-exclamation-octagon-fill",
    accent: "booking-feedback--error",
  },
  warning: {
    icon: "bi-exclamation-triangle-fill",
    accent: "booking-feedback--warning",
  },
  info: {
    icon: "bi-info-circle-fill",
    accent: "booking-feedback--info",
  },
};

const BookingFeedbackModal = ({
  show,
  onHide,
  variant = "success",
  title,
  message,
  reference,
  subtitle,
  packageName,
  paymentMethod,
  primaryLabel = "Done",
  onPrimary,
  showContactLink = false,
}) => {
  const meta = VARIANTS[variant] || VARIANTS.info;

  const handlePrimary = () => {
    if (onPrimary) onPrimary();
    else onHide();
  };

  return (
    <Modal
      show={show}
      onHide={onHide}
      centered
      className="booking-feedback-modal"
      contentClassName={`booking-feedback ${meta.accent}`}
    >
      <Modal.Body className="booking-feedback__body">
        <button
          type="button"
          className="booking-feedback__close"
          onClick={onHide}
          aria-label="Close"
        >
          <i className="bi bi-x-lg" />
        </button>

        <div className="booking-feedback__icon-wrap">
          <i className={`bi ${meta.icon}`} aria-hidden="true" />
        </div>

        <h2 className="booking-feedback__title">{title}</h2>

        {subtitle ? <p className="booking-feedback__subtitle">{subtitle}</p> : null}

        {packageName ? (
          <p className="booking-feedback__package">
            <i className="bi bi-suitcase-lg me-2" aria-hidden="true" />
            {packageName}
          </p>
        ) : null}

        {reference ? (
          <div className="booking-feedback__reference">
            <span className="booking-feedback__reference-label">Booking reference</span>
            <strong>{reference}</strong>
          </div>
        ) : null}

        {paymentMethod ? (
          <p className="booking-feedback__meta">
            <i className="bi bi-wallet2 me-2" aria-hidden="true" />
            Payment: <strong>{paymentMethod}</strong>
          </p>
        ) : null}

        {message ? <p className="booking-feedback__message">{message}</p> : null}

        {variant === "success" ? (
          <ul className="booking-feedback__steps">
            <li>Confirmation email will be sent shortly</li>
            <li>Our team will contact you within 24 hours</li>
            <li>Keep your reference number for support</li>
          </ul>
        ) : null}

        <div className="booking-feedback__actions">
          <Button className="primaryBtn" onClick={handlePrimary}>
            {primaryLabel}
          </Button>
          {showContactLink ? (
            <Button variant="outline-secondary" as={NavLink} to="/contact" onClick={onHide}>
              Contact support
            </Button>
          ) : null}
        </div>
      </Modal.Body>
    </Modal>
  );
};

export default BookingFeedbackModal;
