/**
 * Contact page — form that POSTs to /api/contact.
 */

import { useEffect, useState } from "react";
import { fetchContactInfo, submitContactMessage } from "../api/client.js";

// Empty form state template
const INITIAL_FORM = {
  name: "",
  email: "",
  subject: "",
  message: "",
};

export default function Contact() {
  const [form, setForm] = useState(INITIAL_FORM);
  const [status, setStatus] = useState("idle"); // idle | submitting | success | error
  const [errorMessage, setErrorMessage] = useState("");
  const [contactInfo, setContactInfo] = useState(null);

  useEffect(() => {
    fetchContactInfo().then(setContactInfo).catch(() => setContactInfo(null));
  }, []);

  /** Update a single form field as the user types. */
  function handleChange(event) {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  /** Validate and submit the form to the backend. */
  async function handleSubmit(event) {
    event.preventDefault();
    setStatus("submitting");
    setErrorMessage("");

    try {
      await submitContactMessage(form);
      setStatus("success");
      setForm(INITIAL_FORM);
    } catch (err) {
      setStatus("error");
      setErrorMessage(err.message);
    }
  }

  return (
    <div className="page contact-page">
      <section className="page-header">
        <div className="container page-header-with-crest">
          <div className="page-header-text">
            <h1>Contact Us</h1>
            <p className="page-header-subtitle">
              Questions about events or the chapter? We&apos;d love to hear from you.
            </p>
          </div>
          <img src="/media/photos/Mark 2 Mod 1.jpg" alt="Beta Sigma crest" className="page-header-crest" />
        </div>
      </section>

      <section className="section">
        <div className="container contact-grid">
          {/* Contact form */}
          <form className="contact-form" onSubmit={handleSubmit} noValidate>
            <div className="form-group">
              <label htmlFor="name">Full Name</label>
              <input
                id="name"
                name="name"
                type="text"
                required
                minLength={2}
                value={form.name}
                onChange={handleChange}
                placeholder="Your name"
              />
            </div>

            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                name="email"
                type="email"
                required
                value={form.email}
                onChange={handleChange}
                placeholder="you@email.com"
              />
            </div>

            <div className="form-group">
              <label htmlFor="subject">Subject</label>
              <input
                id="subject"
                name="subject"
                type="text"
                required
                minLength={3}
                value={form.subject}
                onChange={handleChange}
                placeholder="What is this regarding?"
              />
            </div>

            <div className="form-group">
              <label htmlFor="message">Message</label>
              <textarea
                id="message"
                name="message"
                required
                minLength={10}
                rows={6}
                value={form.message}
                onChange={handleChange}
                placeholder="Your message..."
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={status === "submitting"}
            >
              {status === "submitting" ? "Sending..." : "Send Message"}
            </button>

            {status === "success" && (
              <p className="form-success" role="status">
                Thank you! Your message has been received. A chapter officer will
                get back to you soon.
              </p>
            )}

            {status === "error" && (
              <p className="form-error" role="alert">
                {errorMessage || "Something went wrong. Please try again."}
              </p>
            )}
          </form>

          {/* Sidebar with chapter contact details */}
          <aside className="contact-sidebar">
            <div className="contact-info-card">
              <h3>Campus</h3>
              <p>Grove City College</p>
              <p>Grove City, PA 16127</p>
            </div>

            <div className="contact-info-card">
              <h3>Email</h3>
              <p>
                <a href="mailto:gccbetasigmafrat@gmail.com">
                  gccbetasigmafrat@gmail.com
                </a>
              </p>
            </div>

            {contactInfo?.president_email && (
              <div className="contact-info-card">
                <h3>President</h3>
                {contactInfo.president_name && <p>{contactInfo.president_name}</p>}
                <p>
                  <a href={`mailto:${contactInfo.president_email}`}>
                    {contactInfo.president_email}
                  </a>
                </p>
              </div>
            )}

          </aside>
        </div>
      </section>
    </div>
  );
}
