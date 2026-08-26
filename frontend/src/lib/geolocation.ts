export function geolocationErrorMessage(err: GeolocationPositionError): string {
  switch (err.code) {
    case err.PERMISSION_DENIED:
      return 'Доступ к геолокации запрещён. Разрешите его в настройках браузера для этого сайта.'
    case err.POSITION_UNAVAILABLE:
      return 'Не удалось определить местоположение устройства.'
    case err.TIMEOUT:
      return 'Определение адреса заняло слишком много времени. Попробуйте ещё раз.'
    default:
      return 'Не удалось получить доступ к геолокации.'
  }
}
