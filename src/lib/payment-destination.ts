export type PaymentMethod = 'transferencia' | 'multibanco'

interface TransferenciaDestination {
  method: 'transferencia'
  iban: string
}

interface MultibancoDestination {
  method: 'multibanco'
  entidade: string
  referencia: string
}

export type PaymentDestination = TransferenciaDestination | MultibancoDestination

const MULTIBANCO_PREFIX = 'MB|'

export function encodePaymentDestination(destination: PaymentDestination) {
  if (destination.method === 'multibanco') {
    return `${MULTIBANCO_PREFIX}${destination.entidade.trim()}|${destination.referencia.trim()}`
  }

  return destination.iban.trim()
}

export function parsePaymentDestination(value: string): PaymentDestination {
  if (value.startsWith(MULTIBANCO_PREFIX)) {
    const [, entidade = '', referencia = ''] = value.split('|')
    return {
      method: 'multibanco',
      entidade,
      referencia,
    }
  }

  return {
    method: 'transferencia',
    iban: value,
  }
}
