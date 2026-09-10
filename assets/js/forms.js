/*
 * Form handling for the contact form (home page) and the job application
 * forms (careers page).
 *
 * Submissions go to Formspree; CV / cover letter files go to Cloudinary via
 * an unsigned upload preset. Both are configured in assets/js/config.js.
 * If a service is not configured the form is replaced by an "email us"
 * fallback instead of failing silently.
 */
(function () {
    'use strict';

    var config = window.PERCEPT_CONFIG || {};
    var CONTACT_EMAIL = config.CONTACT_EMAIL || 'jobs@percept-ai.co.uk';
    var MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
    var ALLOWED_EXTENSIONS = ['pdf', 'doc', 'docx'];
    var REQUEST_TIMEOUT_MS = 30000;

    // --- helpers -------------------------------------------------------------
    function setStatus(el, state, message) {
        if (!el) { return; }
        el.className = 'form-status show ' + state;
        el.textContent = message;
    }

    function clearStatus(el) {
        if (!el) { return; }
        el.className = 'form-status';
        el.textContent = '';
    }

    function fetchWithTimeout(url, options) {
        var controller = new AbortController();
        var timer = setTimeout(function () { controller.abort(); }, REQUEST_TIMEOUT_MS);
        options = options || {};
        options.signal = controller.signal;
        return fetch(url, options).finally(function () { clearTimeout(timer); });
    }

    function isHoneypotFilled(form) {
        var hp = form.querySelector('input[name="_gotcha"]');
        return !!(hp && hp.value);
    }

    function fileExtension(name) {
        var idx = name.lastIndexOf('.');
        return idx === -1 ? '' : name.slice(idx + 1).toLowerCase();
    }

    function validateFile(file, label) {
        if (!file) {
            throw new Error(label + ' is required');
        }
        if (file.size > MAX_FILE_SIZE) {
            throw new Error(label + ' is too large (max 10 MB)');
        }
        if (ALLOWED_EXTENSIONS.indexOf(fileExtension(file.name)) === -1) {
            throw new Error(label + ' must be a PDF, DOC or DOCX file');
        }
    }

    function mailtoLink(subject) {
        return 'mailto:' + CONTACT_EMAIL + '?subject=' + encodeURIComponent(subject);
    }

    function showFallback(form, fallbackEl, html) {
        form.hidden = true;
        if (fallbackEl) {
            fallbackEl.innerHTML = html;
            fallbackEl.hidden = false;
        }
    }

    function emailLinkHtml(subject) {
        var a = document.createElement('a');
        a.href = mailtoLink(subject);
        a.textContent = CONTACT_EMAIL;
        return a.outerHTML;
    }

    // --- Formspree -----------------------------------------------------------
    function submitToFormspree(formId, formData) {
        return fetchWithTimeout('https://formspree.io/f/' + encodeURIComponent(formId), {
            method: 'POST',
            body: formData,
            headers: { 'Accept': 'application/json' }
        }).then(function (response) {
            if (response.ok) { return response; }
            return response.json().catch(function () { return {}; }).then(function (data) {
                var msg = 'Form submission failed';
                if (data && data.errors && data.errors.length) {
                    msg = data.errors.map(function (e) { return e.message; }).join(', ');
                } else if (data && data.error) {
                    msg = data.error;
                }
                throw new Error(msg);
            });
        });
    }

    // --- Cloudinary ------------------------------------------------------------
    function uploadToCloudinary(file) {
        var formData = new FormData();
        formData.append('file', file);
        formData.append('upload_preset', config.CLOUDINARY_UPLOAD_PRESET);

        var url = 'https://api.cloudinary.com/v1_1/' +
            encodeURIComponent(config.CLOUDINARY_CLOUD_NAME) + '/auto/upload';

        return fetchWithTimeout(url, { method: 'POST', body: formData })
            .then(function (response) {
                return response.json().catch(function () { return {}; }).then(function (data) {
                    if (!response.ok) {
                        throw new Error((data.error && data.error.message) || 'Upload failed');
                    }
                    if (!data.secure_url) {
                        throw new Error('Upload did not return a file URL');
                    }
                    return data.secure_url;
                });
            });
    }

    // --- Contact form (home page) ----------------------------------------------
    function initContactForm() {
        var form = document.getElementById('contactForm');
        if (!form) { return; }

        var statusEl = document.getElementById('contactStatus');
        var fallbackEl = document.getElementById('contactFallback');

        if (!config.FORMSPREE_CONTACT_FORM_ID) {
            showFallback(form, fallbackEl,
                'Please email us at ' + emailLinkHtml('Website enquiry') +
                ' and we will get back to you as soon as possible.');
            return;
        }

        form.addEventListener('submit', function (event) {
            event.preventDefault();
            if (isHoneypotFilled(form)) { return; }

            var submitBtn = form.querySelector('button[type="submit"]');
            submitBtn.disabled = true;
            setStatus(statusEl, 'loading', 'Sending your message...');

            var formData = new FormData(form);
            formData.append('_subject', 'Website enquiry from ' + (formData.get('name') || 'visitor'));

            submitToFormspree(config.FORMSPREE_CONTACT_FORM_ID, formData)
                .then(function () {
                    setStatus(statusEl, 'success', 'Thank you for your message! We will get back to you soon.');
                    form.reset();
                })
                .catch(function (error) {
                    setStatus(statusEl, 'error',
                        'Sorry, your message could not be sent (' + error.message +
                        '). Please try again or email ' + CONTACT_EMAIL + '.');
                })
                .finally(function () {
                    submitBtn.disabled = false;
                });
        });
    }

    // --- Job application forms (careers page) -----------------------------------
    function initApplicationForms() {
        var forms = document.querySelectorAll('.job-application-form');
        if (!forms.length) { return; }

        var filesEnabled = !!(config.CLOUDINARY_CLOUD_NAME && config.CLOUDINARY_UPLOAD_PRESET);

        // Show the chosen file name next to each file input.
        document.querySelectorAll('.job-application-form input[type="file"]').forEach(function (input) {
            input.addEventListener('change', function () {
                var group = input.closest('.form-group');
                var display = group ? group.querySelector('.file-name') : null;
                var file = input.files && input.files[0];
                if (display) {
                    display.textContent = file ? '✓ ' + file.name : '';
                }
            });
        });

        forms.forEach(function (form) {
            var formId = form.dataset.formId;
            var position = form.dataset.position || 'Unspecified position';
            var statusEl = document.getElementById('status-' + formId);
            var fallbackEl = document.getElementById('fallback-' + formId);
            var fileNote = form.querySelector('.file-fallback');

            if (!config.FORMSPREE_CAREERS_FORM_ID) {
                showFallback(form, fallbackEl,
                    'To apply for the <strong>' + position + '</strong> role, please email your CV and cover letter to ' +
                    emailLinkHtml('Application: ' + position) + '.');
                return;
            }

            // Without Cloudinary, drop the file inputs and ask for documents by email.
            if (!filesEnabled) {
                form.querySelectorAll('input[type="file"]').forEach(function (input) {
                    input.required = false;
                    var group = input.closest('.form-group');
                    if (group) { group.hidden = true; }
                });
                if (fileNote) {
                    fileNote.innerHTML = 'After submitting, please email your CV and cover letter to ' +
                        emailLinkHtml('Application: ' + position) + '.';
                    fileNote.hidden = false;
                }
            }

            form.addEventListener('submit', function (event) {
                event.preventDefault();
                if (isHoneypotFilled(form)) { return; }

                var submitBtn = form.querySelector('button[type="submit"]');
                submitBtn.disabled = true;
                setStatus(statusEl, 'loading', 'Sending your application...');

                var cvInput = form.querySelector('input[name="cv"]');
                var coverInput = form.querySelector('input[name="cover"]');

                Promise.resolve()
                    .then(function () {
                        if (!filesEnabled) { return { cv: '', cover: '' }; }

                        var cvFile = cvInput && cvInput.files[0];
                        var coverFile = coverInput && coverInput.files[0];
                        validateFile(cvFile, 'CV');
                        validateFile(coverFile, 'Cover letter');

                        setStatus(statusEl, 'loading', 'Uploading CV...');
                        return uploadToCloudinary(cvFile).then(function (cvUrl) {
                            setStatus(statusEl, 'loading', 'Uploading cover letter...');
                            return uploadToCloudinary(coverFile).then(function (coverUrl) {
                                return { cv: cvUrl, cover: coverUrl };
                            });
                        });
                    })
                    .then(function (urls) {
                        setStatus(statusEl, 'loading', 'Sending application...');

                        var formData = new FormData();
                        ['name', 'email', 'phone', 'location', 'linkedin', 'github', 'message'].forEach(function (field) {
                            var el = form.elements[field];
                            formData.append(field, el ? el.value.trim() : '');
                        });
                        formData.append('position', position);
                        formData.append('cv_url', urls.cv || 'Sent by email');
                        formData.append('cover_letter_url', urls.cover || 'Sent by email');
                        formData.append('submission_date', new Date().toISOString());
                        formData.append('_subject', 'Job application: ' + position);

                        return submitToFormspree(config.FORMSPREE_CAREERS_FORM_ID, formData);
                    })
                    .then(function () {
                        setStatus(statusEl, 'success',
                            '✓ Application submitted successfully! We will review it and get back to you soon.');
                        form.reset();
                        form.querySelectorAll('.file-name').forEach(function (el) { el.textContent = ''; });
                    })
                    .catch(function (error) {
                        setStatus(statusEl, 'error',
                            '✗ ' + error.message + '. Please try again or email ' + CONTACT_EMAIL + '.');
                    })
                    .finally(function () {
                        submitBtn.disabled = false;
                    });
            });

            form.addEventListener('input', function () {
                if (statusEl && statusEl.classList.contains('error')) { clearStatus(statusEl); }
            });
        });
    }

    initContactForm();
    initApplicationForms();
}());
