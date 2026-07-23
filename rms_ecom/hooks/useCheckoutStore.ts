"use client"

import { create } from "zustand"

type CheckoutState = {
  deliveryMethod: 'inside' | 'outside'
  setDeliveryMethod: (method: 'inside' | 'outside') => void
}

export const useCheckoutStore = create<CheckoutState>((set) => ({
  deliveryMethod: typeof window !== 'undefined'
    ? (window.localStorage.getItem('rms.deliveryMethod') as CheckoutState['deliveryMethod']) || 'inside'
    : 'inside',
  setDeliveryMethod: (method) => {
    if (typeof window !== 'undefined') window.localStorage.setItem('rms.deliveryMethod', method)
    set({ deliveryMethod: method })
  },
}))






