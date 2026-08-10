import React from 'react'
import { Helmet } from 'react-helmet-async'

const siteConfig = {
  name: 'Rodab Medical Hospital',
  description: 'Rodab Medical Hospital is opening soon in Entebbe, Uganda. Compassionate emergency care, cardiology, neurology, orthopedics, and more — planned around you.',
  url: 'https://rodabmed.vercel.app',
  logo: 'https://cemaqackwtqkkqxlkttn.supabase.co/storage/v1/object/public/images/logo-footer.png',
  phone: '+353831257105',
  email: 'info@rodabmedical.com',
  address: {
    street: 'Nakawuka Rd, Kajjansi',
    city: 'Entebbe',
    country: 'Uganda',
  },
}

const defaultJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Hospital',
  name: siteConfig.name,
  description: siteConfig.description,
  url: siteConfig.url,
  logo: siteConfig.logo,
  telephone: siteConfig.phone,
  email: siteConfig.email,
  address: {
    '@type': 'PostalAddress',
    streetAddress: siteConfig.address.street,
    addressLocality: siteConfig.address.city,
    addressCountry: siteConfig.address.country,
  },
  medicalSpecialty: [
    'Emergency Medicine',
    'Cardiology',
    'Neurology',
    'Orthopedics',
    'Pediatrics',
    'Diagnostic Imaging',
  ],
  availableService: [
    { '@type': 'MedicalProcedure', name: 'Emergency Care' },
    { '@type': 'MedicalProcedure', name: 'Cardiology Consultation' },
    { '@type': 'MedicalProcedure', name: 'Neurology Consultation' },
    { '@type': 'MedicalTherapy', name: 'Physical Therapy' },
  ],
  priceRange: '$$',
}

export default function SEO({ title, description, jsonLd, url }) {
  const pageTitle = title ? `${title} | ${siteConfig.name}` : `${siteConfig.name} - Compassionate Healthcare in Entebbe, Uganda`
  const pageDescription = description || siteConfig.description
  const pageUrl = url ? `${siteConfig.url}${url}` : siteConfig.url
  const structuredData = jsonLd || defaultJsonLd

  return (
    <Helmet>
      <title>{pageTitle}</title>
      <meta name="description" content={pageDescription} />
      <meta name="robots" content="index, follow" />
      <link rel="canonical" href={pageUrl} />

      {/* Open Graph */}
      <meta property="og:type" content="website" />
      <meta property="og:title" content={pageTitle} />
      <meta property="og:description" content={pageDescription} />
      <meta property="og:url" content={pageUrl} />
      <meta property="og:site_name" content={siteConfig.name} />
      <meta property="og:image" content={siteConfig.logo} />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={pageTitle} />
      <meta name="twitter:description" content={pageDescription} />
      <meta name="twitter:image" content={siteConfig.logo} />

      {/* JSON-LD */}
      <script type="application/ld+json">
        {JSON.stringify(structuredData)}
      </script>
    </Helmet>
  )
}

export { siteConfig }
