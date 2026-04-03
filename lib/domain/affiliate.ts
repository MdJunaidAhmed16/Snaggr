export function getAffiliateLink(domain: string): string {
  const encoded = encodeURIComponent(domain)
  return `https://www.godaddy.com/domainsearch/find?checkAvail=1&domainToCheck=${encoded}&isc=cjcdomsrch`
}

export function getNamecheapLink(domain: string): string {
  const encoded = encodeURIComponent(domain)
  return `https://www.namecheap.com/domains/registration/results/?domain=${encoded}`
}

export interface PurchaseOption {
  registrar: string
  url: string
  logo?: string
}

export function getPurchaseOptions(domain: string): PurchaseOption[] {
  return [
    {
      registrar: 'GoDaddy',
      url: getAffiliateLink(domain),
    },
    {
      registrar: 'Namecheap',
      url: getNamecheapLink(domain),
    },
  ]
}
