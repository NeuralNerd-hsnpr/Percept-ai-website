# Percept AI website

Static marketing site for [percept-ai.co.uk](https://percept-ai.co.uk), hosted on GitHub Pages.

```
index.html          Home: hero, about, contact form
products.html       Product cards
careers.html        Open positions with application forms
404.html            Custom "not found" page
CNAME               Custom domain for GitHub Pages
assets/css/style.css  Single shared stylesheet
assets/js/config.js   Public configuration (form ids etc.)
assets/js/main.js     Navigation, accordion, smooth scroll
assets/js/forms.js    Contact + job application form handling
Images/             Optimised JPEG photos used by the pages
```

There is no build step. Every file is served exactly as it is in this repository.

## Is it safe for this repository to be public?

Yes. **There are no secrets in this repository, and a static website cannot keep any.**
Whatever you put in an HTML/CSS/JS file is sent to every visitor's browser, so a
"secret" in the site is public whether or not the repository is. The earlier
approach of injecting values with a GitHub Actions workflow did not change that:
the injected values ended up in the published `careers.html` in plain text.

The values the site needs (`assets/js/config.js`) are **public identifiers**, not
credentials:

| Value | What it is | How it is protected |
|---|---|---|
| Formspree form id | Address of a form endpoint | In the Formspree dashboard: restrict the form to `percept-ai.co.uk`, enable reCAPTCHA/spam filtering |
| Cloudinary cloud name + unsigned upload preset | Address of an upload endpoint | In the Cloudinary preset: allow only `pdf,doc,docx`, cap file size, upload into a dedicated folder, set access mode to *authenticated*, enable moderation if wanted |

Never put a Cloudinary **API secret**, an SMTP password, or any other real
credential anywhere in this repository. None is needed.

Things that genuinely are visible because the repository is public:

- Commit history, including author names and emails on past commits.
- The site content itself (which is public on the website anyway).

If you would still rather keep the source private, see *Going private* below.

## Configuring the forms

Edit `assets/js/config.js`:

```js
FORMSPREE_CONTACT_FORM_ID: 'abcdwxyz',   // home page "Get in Touch"
FORMSPREE_CAREERS_FORM_ID: 'abcdwxyz',   // job applications (shared by all positions)
CLOUDINARY_CLOUD_NAME:     'your-cloud',
CLOUDINARY_UPLOAD_PRESET:  'percept_ai_uploads',
```

Behaviour when values are empty:

- No contact form id: the contact form is replaced by a "please email us" notice.
- No careers form id: each application form is replaced by an "email your CV" notice.
- Careers form id set but no Cloudinary: the form works, the file inputs are hidden,
  and applicants are asked to email their CV and cover letter after submitting.

Both forms carry a honeypot field (`_gotcha`, understood by Formspree) and a consent checkbox.

### Recommended Formspree settings

1. Restrict the form to your domain (Settings → *Restrict to Domain*).
2. Turn on spam filtering / reCAPTCHA.
3. Set the notification address to the inbox that should receive enquiries.

### Recommended Cloudinary preset settings

Applicant CVs are personal data, so lock the preset down:

1. Signing mode: **Unsigned** (required for browser uploads without a backend).
2. Allowed formats: `pdf, doc, docx`.
3. Max file size: 10 MB (the page enforces the same limit client-side).
4. Folder: e.g. `job-applications/`.
5. Access mode: **Authenticated**, so the uploaded documents are not publicly
   browsable and only signed URLs generated from your dashboard can open them.
6. Consider enabling upload moderation.

## Deployment

GitHub Pages serves the `main` branch. Pushing to `main` publishes the site;
`CNAME` keeps the custom domain, `.nojekyll` skips the Jekyll build.

Because GitHub Pages does not let you set HTTP headers, the pages set a
`Content-Security-Policy` via a `<meta>` tag. If you add a new external script,
stylesheet, or API, add its origin to that policy in each page's `<head>`
(there is one copy per page) or the browser will block it.

### Going private

GitHub Pages on a **free** personal account only publishes public repositories.
Options if you want the source private:

- **GitHub Pro** (paid) allows Pages from a private repository; nothing else changes.
- **Cloudflare Pages / Netlify / Vercel** (free tiers) deploy from a private GitHub
  repository. Connect the repo, set the build command to none and the output
  directory to `/`, then point the `percept-ai.co.uk` DNS records at the new host
  and delete `CNAME` (the new host manages the domain instead).

Nothing in the site depends on the repository being public: all images and assets
are referenced by relative path.

## Local preview

Any static server works, e.g.

```bash
python3 -m http.server 8000
```

then open <http://localhost:8000>.

## Notes

- The product demo buttons currently link to an `ngrok-free.app` tunnel. That
  exposes a development machine to the internet and the URL changes whenever the
  tunnel restarts. Move the demos to a proper host before promoting them.
- No analytics are loaded. If you add Google Analytics later, UK GDPR requires a
  consent banner before the tag runs.
