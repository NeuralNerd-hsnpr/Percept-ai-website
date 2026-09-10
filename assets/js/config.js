/*
 * Public site configuration.
 *
 * NOTHING IN THIS FILE IS SECRET. Every value here is delivered to every
 * visitor's browser, exactly as it would be on any static website. That is
 * fine: these are public identifiers, not credentials. Keep the real
 * protection on the provider side:
 *
 *  - Formspree: restrict each form to the percept-ai.co.uk domain and enable
 *    spam filtering in the Formspree dashboard.
 *  - Cloudinary: use an UNSIGNED upload preset that only allows
 *    pdf/doc/docx, caps the file size, uploads into a dedicated folder and
 *    sets the access mode to "authenticated" so applicant documents are not
 *    publicly browsable. Never put an API secret here.
 *
 * Leave a value empty to disable that feature. The pages fall back to
 * showing the contact email address instead of a broken form.
 */
window.PERCEPT_CONFIG = Object.freeze({
    // Formspree form id for the "Get in Touch" form on the home page.
    FORMSPREE_CONTACT_FORM_ID: '',

    // Formspree form id for job applications (all positions share one form;
    // the position is sent as a field).
    FORMSPREE_CAREERS_FORM_ID: '',

    // Cloudinary cloud name + unsigned upload preset for CV / cover letter
    // uploads. Leave empty to ask applicants to email their documents.
    CLOUDINARY_CLOUD_NAME: '',
    CLOUDINARY_UPLOAD_PRESET: '',

    // Address shown in fallbacks when a form is not configured.
    CONTACT_EMAIL: 'jobs@percept-ai.co.uk'
});
