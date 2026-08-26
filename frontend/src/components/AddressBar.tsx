import { useEffect, useState } from 'react'
import { MapPin, LocateFixed } from 'lucide-react'
import { toast } from 'sonner'
import { addressApi, type Address } from '../api/client'
import { geolocationErrorMessage } from '../lib/geolocation'

export function AddressBar() {
  const [address, setAddress] = useState<Address | null>(null)
  const [locating, setLocating] = useState(false)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    addressApi
      .list()
      .then((addresses) => setAddress(addresses[0] ?? null))
      .catch(() => {})
      .finally(() => setLoaded(true))
  }, [])

  function detectLocation() {
    if (!navigator.geolocation) {
      toast.error('Геолокация не поддерживается браузером')
      return
    }
    if (!window.isSecureContext) {
      toast.error(
        'Геолокация работает только по HTTPS (или на localhost). Откройте сайт по защищённому адресу.',
      )
      return
    }
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const created = await addressApi.create(
            position.coords.latitude,
            position.coords.longitude,
          )
          setAddress(created)
          toast.success('Адрес определён')
        } catch (err) {
          toast.error((err as Error).message)
        } finally {
          setLocating(false)
        }
      },
      (err) => {
        toast.error(geolocationErrorMessage(err))
        setLocating(false)
      },
      { timeout: 15000 },
    )
  }

  if (!loaded) return null

  return (
    <div className="flex items-center gap-2 rounded-full bg-white px-4 py-2.5 ring-1 ring-ink-100">
      <MapPin className="h-4 w-4 shrink-0 text-brand-500" />
      {address ? (
        <>
          <span className="truncate text-sm text-ink-700">{address.location_name}</span>
          <button
            type="button"
            onClick={detectLocation}
            disabled={locating}
            className="ml-auto shrink-0 text-xs font-bold text-brand-600 hover:text-brand-700 disabled:opacity-60"
          >
            {locating ? 'Определяем...' : 'Изменить'}
          </button>
        </>
      ) : (
        <button
          type="button"
          onClick={detectLocation}
          disabled={locating}
          className="flex items-center gap-1.5 text-sm font-semibold text-ink-700 hover:text-brand-600 disabled:opacity-60"
        >
          <LocateFixed className="h-4 w-4" />
          {locating ? 'Определяем адрес...' : 'Определить адрес доставки'}
        </button>
      )}
    </div>
  )
}
