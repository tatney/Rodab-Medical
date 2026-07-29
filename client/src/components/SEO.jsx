import React from 'react'
import { Helmet } from 'react-helmet-async'

const siteConfig = {
  name: 'Rodab Medical Hospital',
  description: 'Compassionate healthcare services in Dublin, Ireland. Emergency care, cardiology, neurology, orthopedics, and more. Open 24/7.',
  url: 'https://rodabmed.vercel.app',
  logo: 'https://cemaqackwtqkkqxlkttn.supabase.co/storage/v1/object/public/images/logo-footer.png',
  phone: '+353831257105',
  email: 'info@rodabmedical.com',
  address: {
    street: 'Dublin',
    city: 'Dublin',
    country: 'Ireland',
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
  openingHoursSpecification: {
    '@type': 'OpeningHoursSpecification',
    dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
    opens: '00:00',
    closes: '23:59',
  },
  priceRange: '$$',
  aggregateRating: {
    '@type': 'AggregateRating',
    ratingValue: '4.8',
    reviewCount: '256',
  },
}

export default function SEO({ title, description, jsonLd, url }) {
  const pageTitle = title ? `${title} | ${siteConfig.name}` : `${siteConfig.name} - Compassionate Healthcare in Dublin`
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
