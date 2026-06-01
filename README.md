# APC Research Redesign Project

> Website redesign project for the **Applied Physics and Chemistry (APC)** research group at **Nano Center Indonesia**.

[![Jekyll](https://img.shields.io/badge/Jekyll-4.x-red?logo=jekyll&logoColor=white)](https://jekyllrb.com/)
[![Deployed on Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black?logo=vercel)](https://vercel.com/)

---

## 🔗 Live Links

- **Main Website:** [https://apc-research-prototype.vercel.app/](https://apc-research-prototype.vercel.app/)
- **Admin Dashboard:** [https://apc-research-prototype.vercel.app/admin/](https://apc-research-prototype.vercel.app/admin/)

---


## 🔬 About

This is a redesign project for the APC Research website, which serves as the central hub for the Applied Physics and Chemistry group at Nano Center Indonesia. It features:

- **Research publications** synced and managed efficiently.
- **Admin Dashboard** to manage articles, people, and other content directly from the web.
- **Research subteam profiles** (Wastewater, Nanofibers, Nano-Petro, Low-Dimensional Materials).
- **Team & people** directory.
- **Partnership & openings** information.

---

## 🗂️ Project Structure

```text
apcresearch-redesign/
├── _config.yml           # Jekyll site configuration
├── _data/                # Site data (publications, research areas)
├── _includes/            # Reusable HTML partials (header, footer, etc.)
├── _layouts/             # Page layout templates
├── _posts/               # Blog/news posts
├── _sass/                # SCSS stylesheets
├── admin/                # Custom Admin Dashboard (CMS)
├── assets/               # Static assets (images, CSS, JS)
├── pages/                # Main site pages (people, research, etc.)
├── vercel.json           # Vercel deployment configuration
├── Gemfile               # Ruby dependencies
└── index.html            # Homepage (landing page)
```

---

## 🚀 Getting Started

### Prerequisites

- [Ruby](https://www.ruby-lang.org/) >= 2.7
- [Bundler](https://bundler.io/)
- [Jekyll](https://jekyllrb.com/) >= 4.x

### Installation

```bash
# Clone the repository
git clone https://github.com/Nehemia17/apcresearch-redesign.git
cd apcresearch-redesign

# Install Ruby dependencies
bundle install
```

### Running Locally

```bash
bundle exec jekyll serve
```

Then open your browser and visit: `http://localhost:4000`

### Admin Dashboard Access
To access the local admin dashboard, navigate to: `http://localhost:4000/admin/` and use the credentials provided above.

